import { once } from "node:events";
import { createServer, type Server } from "node:http";
import type { AddressInfo } from "node:net";
import { createGame } from "@tetris/game-core";
import { MAX_MESSAGE_BYTES, type ServerMessage } from "@tetris/protocol";
import { afterEach, describe, expect, it } from "vitest";
import { WebSocket } from "ws";
import { SessionStore } from "./game/session-store";
import { attachWebSocket, type WsOptions } from "./ws";

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
    store,
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

afterEach(() => {
  close();
  server.close();
});

describe("WebSocket /ws", () => {
  it("plays a game: hello → welcome + paused game, inputs → snapshots (S1)", async () => {
    await start();
    const client = await connect();
    client.send({ type: "hello", protocol: 1 });

    const welcome = await client.next("welcome");
    const game = await client.next("game");
    expect(welcome.sessionId).toMatch(/^[\w-]{22}$/);
    expect(game).toMatchObject({ tick: 0, paused: true });

    client.send({ type: "resume" });
    client.send({ type: "input", seq: 1, tick: 0, actions: ["hardDrop"] });
    client.send({ type: "pause", tick: 3 });
    const snapshot = await client.next("snapshot");

    expect(snapshot).toMatchObject({ tick: 3, ackSeq: 1 });
    expect(snapshot.state.score).toBeGreaterThan(createGame(0).score);
  });

  it("resumes the same paused game after reconnecting (S4)", async () => {
    await start();
    const first = await connect();
    first.send({ type: "hello", protocol: 1 });
    const { sessionId, token } = await first.next("welcome");
    first.send({ type: "resume" });
    first.send({ type: "input", seq: 1, tick: 0, actions: ["left"] });
    first.send({ type: "pause", tick: 5 });
    const paused = await first.next("snapshot");
    first.send({ type: "resume" });
    first.ws.close();
    await once(first.ws, "close");

    const second = await connect();
    second.send({ type: "hello", protocol: 1, resume: { sessionId, token } });
    const game = await second.next("game");

    expect(game).toEqual({ type: "game", tick: 5, state: paused.state, paused: true });
  });

  it("expires sessions after the TTL and rejects a wrong token (S4)", async () => {
    await start();
    const first = await connect();
    first.send({ type: "hello", protocol: 1 });
    const { sessionId, token } = await first.next("welcome");
    first.ws.close();
    await once(first.ws, "close");

    const second = await connect();
    second.send({ type: "hello", protocol: 1, resume: { sessionId, token: "x".repeat(22) } });
    expect(await second.next("error")).toEqual({ type: "error", code: "session_expired" });

    now += 60_000;
    second.send({ type: "hello", protocol: 1, resume: { sessionId, token } });
    expect(await second.next("error")).toEqual({ type: "error", code: "session_expired" });
    expect(store.size).toBe(0);
  });

  it("hands a session over to a new connection and closes the old one", async () => {
    await start();
    const first = await connect();
    first.send({ type: "hello", protocol: 1 });
    const { sessionId, token } = await first.next("welcome");

    const second = await connect();
    second.send({ type: "hello", protocol: 1, resume: { sessionId, token } });
    await second.next("game");
    const [code] = (await once(first.ws, "close")) as [number];

    expect(code).toBe(4000);
  });

  it("answers invalid messages with an error and closes after 3 in a row (S3)", async () => {
    await start();
    const client = await connect();
    client.send("{not json");
    client.send({ type: "input", seq: 1, tick: 0, actions: ["left"] }); // przed hello
    expect(await client.next("error")).toEqual({ type: "error", code: "invalid" });

    client.send({ type: "setScore", score: 1e9 });
    const [code] = (await once(client.ws, "close")) as [number];

    expect(client.messages.filter((m) => m.type === "error")).toHaveLength(3);
    expect(code).toBe(1008);
  });

  it("closes the connection on an oversized message (S3)", async () => {
    await start();
    const client = await connect();
    client.send("x".repeat(MAX_MESSAGE_BYTES + 1));
    const [code] = (await once(client.ws, "close")) as [number];

    expect(code).toBe(1009);
  });

  it("rate-limits message floods (S3)", async () => {
    await start();
    const client = await connect();
    client.send({ type: "hello", protocol: 1 });
    for (let i = 0; i < 15; i++) client.send({ type: "pause", tick: 0 });

    expect(await client.next("error")).toEqual({ type: "error", code: "rate_limited" });
  });

  it("rejects an unsupported protocol version", async () => {
    await start();
    const client = await connect();
    client.send({ type: "hello", protocol: 99 });

    expect(await client.next("error")).toEqual({ type: "error", code: "version" });
  });

  it("refuses new sessions when the server is full", async () => {
    await start();
    for (let i = 0; i < 2; i++) {
      const client = await connect({ "x-forwarded-for": `10.0.0.${i}` });
      client.send({ type: "hello", protocol: 1 });
      await client.next("welcome");
    }
    const third = await connect({ "x-forwarded-for": "10.0.0.9" });
    third.send({ type: "hello", protocol: 1 });

    expect(await third.next("error")).toEqual({ type: "error", code: "server_full" });
  });

  it("rejects upgrades from another origin, on other paths and over the per-IP limit (S3)", async () => {
    await start();
    expect(await upgradeStatus("/ws", { origin: "https://evil.example" })).toBe(403);
    expect(await upgradeStatus("/other", { origin: ORIGIN })).toBe(404);

    const headers = { "x-forwarded-for": "spoofed, 10.1.1.1" };
    for (let i = 0; i < 3; i++) await connect(headers);
    expect(await upgradeStatus("/ws", { origin: ORIGIN, ...headers })).toBe(429);
  });
});
