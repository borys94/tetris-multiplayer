import { once } from "node:events";
import { createServer, type Server } from "node:http";
import type { AddressInfo } from "node:net";
import { PROTOCOL_VERSION, type ServerMessage } from "@tetris/protocol";
import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { WebSocket } from "ws";
import { useTestDatabase } from "../support/db";
import { authenticator } from "../../src/accounts/authenticate";
import { userGames } from "../../src/db/games";
import { SessionStore } from "../../src/game/session-store";
import { createApi } from "../../src/http/api";
import { createApp } from "../../src/http/app";
import { attachWebSocket } from "../../src/ws/server";
import { startGameLoop } from "../../src/play/loop";
import { Players } from "../../src/play/players";
import { saveGameResult } from "../../src/play/results";

const ORIGIN = "https://game.example";
const ctx = useTestDatabase();
let server: Server;
let close: () => void;
const saves: Promise<void>[] = [];

beforeAll(async () => {
  const api = createApi({ db: ctx.db, allowedOrigin: ORIGIN, secureCookies: true });
  server = createServer(createApp({ version: "test", api }));
  const save = saveGameResult(ctx.db);
  const store = new SessionStore({
    bufferTicks: 0,
    maxAheadTicks: 600,
    maxSessions: 10,
    ttlMs: 60_000,
    onGameOver: (session, result) => saves.push(save(session, result)),
  });
  close = attachWebSocket(server, {
    players: new Players(store),
    allowedOrigin: ORIGIN,
    trustProxy: false,
    maxConnectionsPerIp: 0,
    messagesPerSecond: 1000,
    messageBurst: 1000,
    heartbeatMs: 60_000,
    authenticate: authenticator(ctx.db),
  });
  // Pętla czasu rzeczywistego: gra dochodzi do końca w ułamku sekundy przy samych hard dropach.
  const stop = startGameLoop({ sessions: store });
  server.on("close", stop);
  server.listen(0);
  await once(server, "listening");
});

afterAll(() => {
  close();
  server.close();
});

/** Gra przez WebSocket samymi hard dropami aż do końca; zwraca wiadomość `over`. */
async function playUntilOver(cookie?: string) {
  const port = (server.address() as AddressInfo).port;
  const ws = new WebSocket(`ws://127.0.0.1:${port}/ws`, {
    headers: { origin: ORIGIN, ...(cookie ? { cookie } : {}) },
  });
  return new Promise<Extract<ServerMessage, { type: "over" }>>((resolve, reject) => {
    let seq = 0;
    let timer: NodeJS.Timeout | undefined;
    ws.on("open", () => ws.send(JSON.stringify({ type: "hello", protocol: PROTOCOL_VERSION })));
    ws.on("message", (data: Buffer) => {
      const msg = JSON.parse(data.toString()) as ServerMessage;
      if (msg.type === "game") {
        ws.send(JSON.stringify({ type: "resume" }));
        timer = setInterval(() => {
          seq++;
          ws.send(JSON.stringify({ type: "input", seq, tick: seq * 2, actions: ["hardDrop"] }));
        }, 5);
      }
      if (msg.type === "over") {
        clearInterval(timer);
        ws.close();
        resolve(msg);
      }
    });
    ws.on("error", reject);
  });
}

describe("games of logged-in players and guests (S2)", () => {
  it("saves the server's result for a logged-in player and nothing for a guest", async () => {
    const res = await request(server)
      .post("/api/auth/register")
      .set("Origin", ORIGIN)
      .send({ username: "gamer", password: "correct horse battery" });
    const cookie = (res.headers["set-cookie"] as unknown as string[])[0]!.split(";")[0]!;
    const userId = (res.body as { user: { id: number } }).user.id;

    const over = await playUntilOver(cookie);
    await Promise.all(saves);
    const games = await userGames(ctx.db, userId);
    expect(games).toHaveLength(1);
    expect(games[0]).toMatchObject({ score: over.score, lines: over.lines, level: over.level });

    await playUntilOver();
    await Promise.all(saves);
    const { rows } = await ctx.db.query<{ count: number }>(
      "select count(*)::int as count from games",
    );
    expect(rows[0]!.count).toBe(1);
  });

  it("plays as a guest with an invalid session cookie", async () => {
    const over = await playUntilOver(`sid=${"x".repeat(43)}`);
    expect(over.score).toBeGreaterThan(0);
  });
});
