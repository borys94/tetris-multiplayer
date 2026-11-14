import request from "supertest";
import { beforeAll, describe, expect, it, vi } from "vitest";
import { useTestDatabase } from "../../test/db";
import { createApp } from "../app";
import { runCli } from "../cli";
import { insertGame } from "../db/games";
import { createApi } from ".";

const ORIGIN = "https://game.example";
const PASSWORD = "correct horse battery";
const ctx = useTestDatabase();
type Server = ReturnType<typeof createApp>;
let server: Server;

interface Account {
  id: number;
  username: string;
  cookie: string;
}

function cookieOf(res: request.Response): string {
  return (res.headers["set-cookie"] as unknown as string[])[0]!.split(";")[0]!;
}

async function register(username: string): Promise<Account> {
  const res = await request(server)
    .post("/api/auth/register")
    .set("Origin", ORIGIN)
    .send({ username, password: PASSWORD });
  const { id } = (res.body as { user: { id: number } }).user;
  return { id, username, cookie: cookieOf(res) };
}

function as(account: Account | null) {
  const withAuth = (req: request.Test) => {
    req.set("Origin", ORIGIN);
    return account ? req.set("Cookie", account.cookie) : req;
  };
  return {
    get: (path: string) => withAuth(request(server).get(path)),
    post: (path: string, body: object = {}) => withAuth(request(server).post(path)).send(body),
    patch: (path: string, body: object) => withAuth(request(server).patch(path)).send(body),
    delete: (path: string) => withAuth(request(server).delete(path)),
  };
}

let admin: Account;
let player: Account;

beforeAll(async () => {
  server = createApp({
    version: "test",
    api: createApi({ db: ctx.db, allowedOrigin: ORIGIN, secureCookies: true }),
  });
  admin = await register("boss");
  player = await register("pawn");
  vi.spyOn(console, "log").mockImplementation(() => {});
  expect(await runCli(ctx.db, ["promote", "BOSS"])).toBe(0);
  admin.cookie = cookieOf(
    await as(null).post("/api/auth/login", { username: "boss", password: PASSWORD }),
  );
});

describe("promote command", () => {
  it("grants the admin role to an existing account only", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    expect((await as(admin).get("/api/me")).body).toMatchObject({ user: { role: "admin" } });
    expect(await runCli(ctx.db, ["promote", "ghost"])).toBe(1);
    expect(await runCli(ctx.db, ["demote", "boss"])).toBe(2);
  });
});

describe("leaderboard and history (R3)", () => {
  it("shows the public leaderboard and the player's own games", async () => {
    await insertGame(ctx.db, player.id, { score: 1200, lines: 10, level: 2, ticks: 3000 });

    const board = await as(null).get("/api/leaderboard");
    expect(board.status).toBe(200);
    expect((board.body as { entries: unknown[] }).entries).toEqual([
      expect.objectContaining({
        rank: 1,
        username: "pawn",
        score: 1200,
        gameId: expect.any(Number) as number,
      }),
    ]);

    expect((await as(null).get("/api/me/games")).status).toBe(401);
    const games = await as(player).get("/api/me/games");
    expect((games.body as { games: unknown[] }).games).toEqual([
      expect.objectContaining({ score: 1200, lines: 10, level: 2 }),
    ]);
  });
});

describe("admin API (S4)", () => {
  it("is closed to guests (401) and players (403)", async () => {
    expect((await as(null).get("/api/admin/users")).status).toBe(401);
    expect((await as(player).get("/api/admin/users")).status).toBe(403);
    expect(
      (await as(player).patch(`/api/admin/users/${player.id}`, { role: "admin" })).status,
    ).toBe(403);
  });

  it("searches accounts", async () => {
    const res = await as(admin).get("/api/admin/users?q=PAW");
    expect((res.body as { users: { username: string }[] }).users.map((u) => u.username)).toEqual([
      "pawn",
    ]);
  });

  it("disables a player: sessions end, login is refused, and re-enabling restores access", async () => {
    const victim = await register("victim");

    const disabled = await as(admin).patch(`/api/admin/users/${victim.id}`, { disabled: true });
    expect(disabled.body).toMatchObject({ user: { username: "victim", disabled: true } });
    expect((await as(victim).get("/api/me")).status).toBe(401);
    const login = await as(null).post("/api/auth/login", {
      username: "victim",
      password: PASSWORD,
    });
    expect(login.status).toBe(403);

    await as(admin).patch(`/api/admin/users/${victim.id}`, { disabled: false });
    expect(
      (await as(null).post("/api/auth/login", { username: "victim", password: PASSWORD })).status,
    ).toBe(200);
  });

  it("sets a temporary password that replaces the old one and logs the account out", async () => {
    const forgetful = await register("forgetful");

    const res = await as(admin).post(`/api/admin/users/${forgetful.id}/password`);
    const { password } = res.body as { password: string };
    expect(password).toMatch(/^[\w-]{16}$/);
    expect((await as(forgetful).get("/api/me")).status).toBe(401);

    const old = await as(null).post("/api/auth/login", {
      username: "forgetful",
      password: PASSWORD,
    });
    const fresh = await as(null).post("/api/auth/login", { username: "forgetful", password });
    expect([old.status, fresh.status]).toEqual([401, 200]);
  });

  it("grants and revokes the admin role", async () => {
    const helper = await register("helper");
    expect(
      (await as(admin).patch(`/api/admin/users/${helper.id}`, { role: "admin" })).body,
    ).toMatchObject({ user: { role: "admin" } });
    expect(
      (await as(admin).patch(`/api/admin/users/${helper.id}`, { role: null })).body,
    ).toMatchObject({ user: { role: null } });
  });

  it("does not let an admin demote or disable themselves", async () => {
    for (const change of [{ role: null }, { disabled: true }]) {
      const res = await as(admin).patch(`/api/admin/users/${admin.id}`, change);
      expect([res.status, res.body]).toEqual([400, { error: "cannot_change_self" }]);
    }
  });

  it("lists and deletes a player's game", async () => {
    const id = await insertGame(ctx.db, player.id, { score: 5, lines: 0, level: 1, ticks: 60 });
    const games = await as(admin).get(`/api/admin/users/${player.id}/games`);
    expect((games.body as { games: { id: number }[] }).games.map((g) => g.id)).toContain(id);

    expect((await as(admin).delete(`/api/admin/games/${id}`)).status).toBe(204);
    expect((await as(admin).delete(`/api/admin/games/${id}`)).status).toBe(404);
  });

  it.each([
    ["an invalid id", "/api/admin/users/abc", { role: "admin" }, 400],
    ["an unknown role", `/api/admin/users/1`, { role: "player" }, 400],
    ["no changes", `/api/admin/users/1`, {}, 400],
    ["a missing user", "/api/admin/users/999999", { disabled: true }, 404],
  ])("rejects %s", async (_name, path, body, status) => {
    expect((await as(admin).patch(path, body)).status).toBe(status);
  });
});
