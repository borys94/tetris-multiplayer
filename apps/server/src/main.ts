import { createServer } from "node:http";
import { TICKS_PER_SECOND } from "@tetris/game-core";
import { createApi } from "./api";
import { createApp } from "./app";
import { runCli } from "./cli";
import { loadConfig } from "./config";
import { createPool, migrate, type Db } from "./db/pool";
import { deleteExpiredSessions } from "./db/sessions";
import { authenticateWebSocket, saveGameResult, saveMatchResult } from "./game/accounts";
import { SessionStore } from "./game/session-store";
import { log } from "./observability/logger";
import { RoomStore } from "./rooms/room-store";
import { createMetricsServer, trackGauge, trackPool, trackRooms } from "./observability/metrics";
import { attachWebSocket } from "./ws";

/** Przy pierwszym deployu Postgres może startować dłużej niż serwer: ponawiamy przez ok. 2 min. */
async function migrateWhenReady(db: Db): Promise<number[]> {
  for (let attempt = 1; ; attempt++) {
    try {
      return await migrate(db);
    } catch (error) {
      if (attempt >= 60) throw error;
      log.warn(
        { attempt, error: error instanceof Error ? error.message : String(error) },
        "database not ready, retrying in 2 s",
      );
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }
  }
}

async function main(): Promise<void> {
  const config = loadConfig(process.env);
  const { version, staticDir } = config;

  const db = createPool(config.databaseUrl);
  const migrated = await migrateWhenReady(db);
  if (migrated.length > 0) log.info({ migrations: migrated }, "applied migrations");

  // `node main.cjs <komenda>`: komenda administracyjna zamiast serwera.
  const args = process.argv.slice(2);
  if (args.length > 0) {
    const code = await runCli(db, args);
    await db.end();
    process.exit(code);
  }

  const saveMatch = saveMatchResult(db);
  const rooms = new RoomStore({
    bufferTicks: config.bufferTicks,
    maxAheadTicks: TICKS_PER_SECOND,
    ttlMs: config.sessionTtlMs,
    maxRooms: config.maxRooms,
    onMatchEnd: (result) => void saveMatch(result),
  });
  const api = createApi({
    db,
    rooms,
    ...(config.allowedOrigin ? { allowedOrigin: config.allowedOrigin } : {}),
    secureCookies: config.secureCookies,
  });
  let draining = false;
  const isReady = () => !draining;
  const app = createApp(
    staticDir ? { version, staticDir, api, isReady } : { version, api, isReady },
  );
  const server = createServer(app);

  const saveResult = saveGameResult(db);
  const store = new SessionStore({
    bufferTicks: config.bufferTicks,
    maxAheadTicks: TICKS_PER_SECOND,
    maxSessions: config.maxSessions,
    ttlMs: config.sessionTtlMs,
    onGameOver: (session, result) => void saveResult(session, result),
  });
  // Jedna pętla dla sesji i pokoi: alert wolnego ticka obejmuje też mecze 1v1.
  const stopLoop = store.start((ticks) => rooms.advance(ticks));
  trackRooms(() => rooms.countByState());
  trackGauge(
    "blockfall_game_sessions",
    "Sesje gry w pamięci (także czekające na wznowienie)",
    () => store.size,
  );
  trackPool(db);
  const metricsServer = config.metricsPort > 0 ? createMetricsServer() : null;
  metricsServer?.listen(config.metricsPort, () => {
    log.info({ port: config.metricsPort }, "metrics listening");
  });
  const ws = attachWebSocket(server, {
    store,
    rooms,
    ...(config.allowedOrigin ? { allowedOrigin: config.allowedOrigin } : {}),
    trustProxy: config.trustProxy,
    maxConnectionsPerIp: config.maxConnectionsPerIp,
    messagesPerSecond: 90,
    messageBurst: 120,
    heartbeatMs: 15_000,
    authenticate: authenticateWebSocket(db),
  });

  // Sprzątanie wygasłych sesji logowania co godzinę.
  const cleanup = setInterval(
    () => {
      deleteExpiredSessions(db).catch((error: unknown) =>
        log.error({ err: error }, "session cleanup failed"),
      );
    },
    60 * 60 * 1000,
  );

  server.listen(config.port, () => {
    log.info({ port: config.port, bufferTicks: config.bufferTicks }, "server listening");
  });

  const shutdown = () => {
    clearInterval(cleanup);
    stopLoop();
    ws();
    metricsServer?.close();
    server.close(() => {
      void db.end().finally(() => process.exit(0));
    });
  };

  // Deploy (spec 007): Kubernetes wysyła SIGTERM, gdy nowy pod jest już gotowy. Stary pod
  // przestaje być `ready`, odsyła graczy spoza meczów do nowego (zamknięcie WebSocketu
  // i ponowne połączenie) i czeka, aż skończą się trwające mecze, najdłużej DRAIN_TIMEOUT_MS.
  // Ctrl+C (SIGINT) i drugi SIGTERM zamykają serwer od razu.
  process.on("SIGINT", shutdown);
  process.on("SIGTERM", () => {
    if (draining) return shutdown();
    draining = true;
    rooms.drain();
    ws.drain();
    const deadline = Date.now() + config.drainTimeoutMs;
    log.info({ matches: rooms.playing, timeoutMs: config.drainTimeoutMs }, "draining");
    const check = setInterval(() => {
      ws.drain();
      if (rooms.playing > 0 && Date.now() < deadline) return;
      clearInterval(check);
      log.info({ unfinishedMatches: rooms.playing }, "drained, shutting down");
      shutdown();
    }, 1000);
  });
}

main().catch((error: unknown) => {
  log.fatal({ err: error }, "server failed to start");
  process.exit(1);
});
