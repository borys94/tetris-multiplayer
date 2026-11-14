import { createServer } from "node:http";
import { TICKS_PER_SECOND } from "@tetris/game-core";
import { createApi } from "./api";
import { createApp } from "./app";
import { runCli } from "./cli";
import { loadConfig } from "./config";
import { createPool, migrate } from "./db/pool";
import { deleteExpiredSessions } from "./db/sessions";
import { authenticateWebSocket, saveGameResult } from "./game/accounts";
import { SessionStore } from "./game/session-store";
import { attachWebSocket } from "./ws";

async function main(): Promise<void> {
  const config = loadConfig(process.env);
  const { version, staticDir } = config;

  const db = createPool(config.databaseUrl);
  const migrated = await migrate(db);
  if (migrated.length > 0) console.log(`applied migrations: ${migrated.join(", ")}`);

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
        console.error("session cleanup failed", error),
      );
    },
    60 * 60 * 1000,
  );

  server.listen(config.port, () => {
    console.log(
      `server ${version} listening on http://localhost:${config.port} (input buffer ${config.bufferTicks} ticks)`,
    );
  });

  // Kubernetes wysyła SIGTERM przed zatrzymaniem poda: zamykamy WebSockety
  // (klienci połączą się ponownie), kończymy trwające żądania i wychodzimy.
  for (const signal of ["SIGTERM", "SIGINT"] as const) {
    process.on(signal, () => {
      clearInterval(cleanup);
      stopLoop();
      closeWs();
      server.close(() => {
        void db.end().finally(() => process.exit(0));
      });
    });
  }
}

main().catch((error: unknown) => {
  console.error("server failed to start", error);
  process.exit(1);
});
