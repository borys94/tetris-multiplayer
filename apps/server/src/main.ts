import { createServer } from "node:http";
import { TICKS_PER_SECOND } from "@tetris/game-core";
import { createApi } from "./api";
import { createApp } from "./app";
import { runCli } from "./cli";
import { loadConfig } from "./config";
import { createPool, migrate, type Db } from "./db/pool";
import { deleteExpiredSessions } from "./db/sessions";
import { authenticateWebSocket, saveGameResult } from "./game/accounts";
import { SessionStore } from "./game/session-store";
import { log } from "./observability/logger";
import { createMetricsServer, trackGauge, trackPool } from "./observability/metrics";
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

  const api = createApi({
    db,
    ...(config.allowedOrigin ? { allowedOrigin: config.allowedOrigin } : {}),
    secureCookies: config.secureCookies,
  });
  const app = createApp(staticDir ? { version, staticDir, api } : { version, api });
  const server = createServer(app);

  const saveResult = saveGameResult(db);
  const store = new SessionStore({
    bufferTicks: config.bufferTicks,
    maxAheadTicks: TICKS_PER_SECOND,
    maxSessions: config.maxSessions,
    ttlMs: config.sessionTtlMs,
    onGameOver: (session, result) => void saveResult(session, result),
  });
  const stopLoop = store.start();
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
  const closeWs = attachWebSocket(server, {
    store,
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

  // Kubernetes wysyła SIGTERM przed zatrzymaniem poda: zamykamy WebSockety
  // (klienci połączą się ponownie), kończymy trwające żądania i wychodzimy.
  for (const signal of ["SIGTERM", "SIGINT"] as const) {
    process.on(signal, () => {
      clearInterval(cleanup);
      stopLoop();
      closeWs();
      metricsServer?.close();
      server.close(() => {
        void db.end().finally(() => process.exit(0));
      });
    });
  }
}

main().catch((error: unknown) => {
  log.fatal({ err: error }, "server failed to start");
  process.exit(1);
});
