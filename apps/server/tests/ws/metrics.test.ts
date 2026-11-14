import { once } from "node:events";
import { createServer, type Server } from "node:http";
import type { AddressInfo } from "node:net";
import { PROTOCOL_VERSION, type ServerMessage } from "@tetris/protocol";
import { afterEach, describe, expect, it, vi } from "vitest";
import { WebSocket } from "ws";
import { metricValue } from "../support/metrics";
import { SessionStore } from "../../src/game/session-store";
import { Players } from "../../src/play/players";
import {
  gamesStarted,
  serverFull,
  wsConnections,
  wsErrors,
  wsMessages,
  wsRejected,
} from "../../src/observability/metrics";
import { attachWebSocket, type WsOptions } from "../../src/ws/server";

const ORIGIN = "https://game.example";

interface Client {
  ws: WebSocket;
  messages: ServerMessage[];
  send(msg: unknown): void;
  /** Czeka na wiadomość danego typu, której jeszcze nie odebraliśmy w tym kliencie. */
  next<T extends ServerMessage["type"]>(type: T): Promise<Extract<ServerMessage, { type: T }>>;
}

let server: Server;
let store: SessionStore;
let close: () => void;
let now = 0;

async function start(overrides: Partial<WsOptions> = {}) {
  now = 0;
  store = new SessionStore(
    { bufferTicks: 9, maxAheadTicks: 60, maxSessions: 2, ttlMs: 60_000 },
    () => now,
  );
  server = createServer();
  close = attachWebSocket(server, {
    players: new Players(store),
    allowedOrigin: ORIGIN,
    trustProxy: true,
    maxConnectionsPerIp: 3,
    messagesPerSecond: 10,
    messageBurst: 10,
    heartbeatMs: 60_000,
    ...overrides,
  });
  server.listen(0);
  await once(server, "listening");
}

function url(path = "/ws") {
  return `ws://127.0.0.1:${(server.address() as AddressInfo).port}${path}`;
}

async function connect(headers: Record<string, string> = {}): Promise<Client> {
  const ws = new WebSocket(url(), { headers: { origin: ORIGIN, ...headers } });
  const messages: ServerMessage[] = [];
  const seen = new Map<string, number>();
  const waiters: (() => void)[] = [];
  ws.on("message", (data: Buffer) => {
    messages.push(JSON.parse(data.toString()) as ServerMessage);
    waiters.splice(0).forEach((wake) => wake());
  });
  await once(ws, "open");

  return {
    ws,
    messages,
    send: (msg) => ws.send(typeof msg === "string" ? msg : JSON.stringify(msg)),
    async next(type) {
      for (;;) {
        const from = seen.get(type) ?? 0;
        const index = messages.findIndex((m, i) => i >= from && m.type === type);
        if (index >= 0) {
          seen.set(type, index + 1);
          return messages[index] as never;
        }
        await new Promise<void>((resolve) => waiters.push(resolve));
      }
    },
  };
}

async function upgradeStatus(path: string, headers: Record<string, string>): Promise<number> {
  const ws = new WebSocket(url(path), { headers });
  const [, res] = (await once(ws, "unexpected-response")) as [unknown, { statusCode: number }];
  return res.statusCode;
}

// Osobny plik: vitest izoluje moduły per plik, więc liczniki startują od zera.
afterEach(() => {
  close();
  server.close();
});

describe("WebSocket metrics", () => {
  it("counts connections, games, messages, errors and rejections (spec 006, S1)", async () => {
    await start();
    const before = {
      connections: await metricValue(wsConnections),
      started: await metricValue(gamesStarted),
      messages: await metricValue(wsMessages),
      invalid: await metricValue(wsErrors, { code: "invalid" }),
      origin: await metricValue(wsRejected, { reason: "origin" }),
      full: await metricValue(serverFull),
    };

    const client = await connect();
    client.send({ type: "hello", protocol: PROTOCOL_VERSION });
    await client.next("welcome");
    client.send({ type: "newGame" });
    client.send("{not json");
    await client.next("error");
    expect(await metricValue(wsConnections)).toBe(before.connections + 1);
    expect(await metricValue(gamesStarted)).toBe(before.started + 2);
    expect(await metricValue(wsMessages)).toBe(before.messages + 3);
    expect(await metricValue(wsErrors, { code: "invalid" })).toBe(before.invalid + 1);

    for (let i = 0; i < 2; i++) {
      const other = await connect({ "x-forwarded-for": `10.2.0.${i}` });
      other.send({ type: "hello", protocol: PROTOCOL_VERSION });
      await other.next(i === 0 ? "welcome" : "error");
    }
    expect(await metricValue(serverFull)).toBe(before.full + 1);

    await upgradeStatus("/ws", { origin: "https://evil.example" });
    expect(await metricValue(wsRejected, { reason: "origin" })).toBe(before.origin + 1);

    client.ws.close();
    await once(client.ws, "close");
    // Zostaje jedno połączenie: drugie zamknął serwer po „server full”.
    await vi.waitFor(async () =>
      expect(await metricValue(wsConnections)).toBe(before.connections + 1),
    );
  });
});
