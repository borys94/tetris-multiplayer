import request from "supertest";
import { describe, expect, it } from "vitest";
import { useTestDatabase } from "../../test/db";
import { createApp } from "../app";
import { LOCK_MS, LoginLimiter, MAX_FAILURES } from "../auth/login-limiter";
import { setDisabled } from "../db/users";
import { createApi } from ".";

const ORIGIN = "https://game.example";
const ctx = useTestDatabase();
let now = 0;

function app() {
  const limiter = new LoginLimiter(() => now);
  return createApp({
    version: "test",
    api: createApi({ db: ctx.db, allowedOrigin: ORIGIN, secureCookies: true, limiter }),
  });
}

let counter = 0;
const uniqueName = () => `player${++counter}`;
const PASSWORD = "correct horse battery";

function post(server: ReturnType<typeof app>, path: string, body: object, cookie?: string) {
  const req = request(server).post(path).set("Origin", ORIGIN).send(body);
  return cookie ? req.set("Cookie", cookie) : req;
}

function userOf(res: request.Response) {
  return (res.body as { user: { id: number; username: string; role: string | null } }).user;
}

function sessionCookieOf(res: request.Response): string {
  const header = res.headers["set-cookie"] as unknown as string[];
  return header[0]!.split(";")[0]!;
}

describe("auth API (S1)", () => {
  it("registers, sets a secure session cookie and returns the profile", async () => {
    const server = app();
    const res = await post(server, "/api/auth/register", {
      username: "  NewPlayer ",
      password: PASSWORD,
    });

    expect(res.status).toBe(201);
    expect(res.body).toEqual({
      user: { id: expect.any(Number) as number, username: "newplayer", role: null },
    });
    const cookie = (res.headers["set-cookie"] as unknown as string[])[0]!;
    expect(cookie).toMatch(
      /^sid=[\w-]{43}; Path=\/; HttpOnly; SameSite=Lax; Max-Age=2592000; Secure$/,
    );

    const me = await request(server).get("/api/me").set("Cookie", sessionCookieOf(res));
    expect(userOf(me).username).toBe("newplayer");
  });

  it.each([
    [{ username: "ab", password: PASSWORD }, "invalid_username"],
    [{ username: "bad name!", password: PASSWORD }, "invalid_username"],
    [{ username: "fine_name", password: "short" }, "invalid_password"],
    [{ username: "fine_name", password: "x".repeat(129) }, "invalid_password"],
    [{ username: 5, password: PASSWORD }, "invalid_username"],
  ])("rejects invalid registration %j", async (body, error) => {
    const res = await post(app(), "/api/auth/register", body);
    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error });
  });

  it("rejects a taken username regardless of case", async () => {
    const server = app();
    const username = uniqueName();
    await post(server, "/api/auth/register", { username, password: PASSWORD });
    const res = await post(server, "/api/auth/register", {
      username: username.toUpperCase(),
      password: PASSWORD,
    });

    expect(res.status).toBe(409);
  });

  it("logs out, logs in again and rejects wrong credentials with one message", async () => {
    const server = app();
    const username = uniqueName();
    const registered = await post(server, "/api/auth/register", { username, password: PASSWORD });
    const cookie = sessionCookieOf(registered);

    const logout = await post(server, "/api/auth/logout", {}, cookie);
    expect(logout.status).toBe(204);
    expect((logout.headers["set-cookie"] as unknown as string[])[0]).toMatch(/^sid=; .*Max-Age=0/);
    expect((await request(server).get("/api/me").set("Cookie", cookie)).status).toBe(401);

    const wrongPassword = await post(server, "/api/auth/login", {
      username,
      password: "wrong password",
    });
    const wrongUser = await post(server, "/api/auth/login", {
      username: "nobody-here",
      password: PASSWORD,
    });
    expect([wrongPassword.status, wrongPassword.body]).toEqual([
      401,
      { error: "invalid_credentials" },
    ]);
    expect([wrongUser.status, wrongUser.body]).toEqual([401, { error: "invalid_credentials" }]);

    const login = await post(server, "/api/auth/login", { username, password: PASSWORD });
    expect(login.status).toBe(200);
    expect(userOf(login).username).toBe(username);
  });

  it("locks a username for 15 minutes after 5 failed logins", async () => {
    now = 0;
    const server = app();
    const username = uniqueName();
    await post(server, "/api/auth/register", { username, password: PASSWORD });
    for (let i = 0; i < MAX_FAILURES; i++) {
      await post(server, "/api/auth/login", { username, password: "wrong password" });
    }

    const locked = await post(server, "/api/auth/login", { username, password: PASSWORD });
    expect(locked.status).toBe(429);
    expect(locked.headers["retry-after"]).toBe("900");

    now += LOCK_MS;
    expect((await post(server, "/api/auth/login", { username, password: PASSWORD })).status).toBe(
      200,
    );
  });

  it("refuses to log in a disabled account (S4)", async () => {
    const server = app();
    const username = uniqueName();
    const res = await post(server, "/api/auth/register", { username, password: PASSWORD });
    await setDisabled(ctx.db, userOf(res).id, true);

    const login = await post(server, "/api/auth/login", { username, password: PASSWORD });
    expect([login.status, login.body]).toEqual([403, { error: "account_disabled" }]);
  });
});

describe("CSRF protection (S3)", () => {
  it("rejects state changes from another origin or without an origin", async () => {
    const server = app();
    const body = { username: uniqueName(), password: PASSWORD };

    const foreign = await request(server)
      .post("/api/auth/register")
      .set("Origin", "https://evil.example")
      .send(body);
    const missing = await request(server).post("/api/auth/register").send(body);

    expect([foreign.status, missing.status]).toEqual([403, 403]);
  });

  it("accepts only JSON bodies", async () => {
    const res = await request(app())
      .post("/api/auth/login")
      .set("Origin", ORIGIN)
      .type("form")
      .send("username=a&password=b");

    expect(res.status).toBe(415);
  });

  it("answers unknown API paths with JSON 404", async () => {
    const res = await request(app()).get("/api/nope");
    expect([res.status, res.body]).toEqual([404, { error: "not_found" }]);
  });
});
