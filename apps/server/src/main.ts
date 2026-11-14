import { createServer } from "node:http";
import { TICKS_PER_SECOND } from "@tetris/game-core";
import { createApp } from "./app";
import { loadConfig } from "./config";
import { SessionStore } from "./game/session-store";
import { attachWebSocket } from "./ws";

const config = loadConfig(process.env);
const { version, staticDir } = config;

const app = createApp(staticDir ? { version, staticDir } : { version });
const server = createServer(app);

const store = new SessionStore({
  bufferTicks: config.bufferTicks,
  maxAheadTicks: TICKS_PER_SECOND,
  maxSessions: config.maxSessions,
  ttlMs: config.sessionTtlMs,
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
});

server.listen(config.port, () => {
  console.log(
    `server ${version} listening on http://localhost:${config.port} (input buffer ${config.bufferTicks} ticks)`,
  );
});

// Kubernetes wysyła SIGTERM przed zatrzymaniem poda: zamykamy WebSockety
// (klienci połączą się ponownie), kończymy trwające żądania i wychodzimy.
for (const signal of ["SIGTERM", "SIGINT"] as const) {
  process.on(signal, () => {
    stopLoop();
    closeWs();
    server.close(() => process.exit(0));
  });
}
