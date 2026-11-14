import { describe, expect, it } from "vitest";
import { useTestDatabase } from "../../test/db";
import { deleteGame, insertGame, leaderboard, userGames } from "./games";
import { MIGRATIONS } from "./migrations";
import { migrate } from "./pool";
import { createSession, deleteExpiredSessions, deleteSession, useSession } from "./sessions";
import {
  createUser,
  findUserById,
  findUserByUsername,
  searchUsers,
  setDisabled,
  setPasswordHash,
  setRole,
} from "./users";

const ctx = useTestDatabase();
const DAY = 24 * 60 * 60 * 1000;
const inDays = (days: number) => new Date(Date.now() + days * DAY);
const result = (score: number) => ({ score, lines: 1, level: 1, ticks: 600 });

let counter = 0;
async function newUser(prefix = "user") {
  const user = await createUser(ctx.db, `${prefix}${++counter}`, "hash");
  return user!;
}

describe("migrate", () => {
  it("applies every migration once and is idempotent (R5)", async () => {
    expect(await migrate(ctx.db)).toEqual([]); // już zastosowane w useTestDatabase
    const { rows } = await ctx.db.query<{ id: number }>("select id from schema_migrations");
    expect(rows.map((row) => row.id)).toEqual(MIGRATIONS.map((m) => m.id));
  });

  it("runs safely when several processes migrate at once", async () => {
    const results = await Promise.all([migrate(ctx.db), migrate(ctx.db), migrate(ctx.db)]);
    expect(results.flat()).toEqual([]);
  });
});

describe("users", () => {
  it("creates players without a role and rejects a taken username", async () => {
    const user = await createUser(ctx.db, "alice", "hash-a");

    expect(user).toMatchObject({ username: "alice", role: null, disabled: false });
    expect(await createUser(ctx.db, "alice", "hash-b")).toBeNull();
    expect(await findUserByUsername(ctx.db, "alice")).toMatchObject({ passwordHash: "hash-a" });
  });

  it("enforces lowercase usernames and the admin-only role in the schema", async () => {
    await expect(createUser(ctx.db, "Alice", "x")).rejects.toThrow(/check/);
    const user = await newUser();
    await expect(
      ctx.db.query("update users set role = 'player' where id = $1", [user.id]),
    ).rejects.toThrow(/check/);
  });

  it("grants and revokes the admin role", async () => {
    const user = await newUser();
    await setRole(ctx.db, user.id, "admin");
    expect((await findUserById(ctx.db, user.id))?.role).toBe("admin");
    await setRole(ctx.db, user.id, null);
    expect((await findUserById(ctx.db, user.id))?.role).toBeNull();
  });

  it("searches usernames literally, including LIKE wildcards", async () => {
    await createUser(ctx.db, "search_me", "x");
    await createUser(ctx.db, "searchxme", "x");

    expect((await searchUsers(ctx.db, "search_me")).map((u) => u.username)).toEqual(["search_me"]);
  });

  it("changes the password hash", async () => {
    const user = await newUser();
    await setPasswordHash(ctx.db, user.id, "new-hash");
    expect((await findUserByUsername(ctx.db, user.username))?.passwordHash).toBe("new-hash");
  });
});

describe("sessions", () => {
  it("returns the user of a valid session and extends it", async () => {
    const user = await newUser();
    const token = Buffer.from(`token-${user.id}`);
    await createSession(ctx.db, token, user.id, inDays(1));

    expect(await useSession(ctx.db, token, inDays(30))).toEqual({
      id: user.id,
      username: user.username,
      role: null,
    });
    const { rows } = await ctx.db.query<{ expires_at: Date }>(
      "select expires_at from sessions where id = $1",
      [token],
    );
    expect(rows[0]!.expires_at.getTime()).toBeGreaterThan(inDays(29).getTime());
  });

  it("ignores expired and deleted sessions and cleans up expired ones", async () => {
    const user = await newUser();
    const expired = Buffer.from(`expired-${user.id}`);
    const deleted = Buffer.from(`deleted-${user.id}`);
    await createSession(ctx.db, expired, user.id, inDays(-1));
    await createSession(ctx.db, deleted, user.id, inDays(1));
    await deleteSession(ctx.db, deleted);

    expect(await useSession(ctx.db, expired, inDays(30))).toBeNull();
    expect(await useSession(ctx.db, deleted, inDays(30))).toBeNull();
    expect(await deleteExpiredSessions(ctx.db)).toBeGreaterThanOrEqual(1);
  });

  it("drops all sessions of a disabled user and blocks new ones (S4)", async () => {
    const user = await newUser();
    const token = Buffer.from(`disabled-${user.id}`);
    await createSession(ctx.db, token, user.id, inDays(1));

    await setDisabled(ctx.db, user.id, true);
    expect(await useSession(ctx.db, token, inDays(30))).toBeNull();
    const { rowCount } = await ctx.db.query("select 1 from sessions where user_id = $1", [user.id]);
    expect(rowCount).toBe(0);

    await createSession(ctx.db, token, user.id, inDays(1));
    expect(await useSession(ctx.db, token, inDays(30))).toBeNull();

    await setDisabled(ctx.db, user.id, false);
    expect(await useSession(ctx.db, token, inDays(30))).not.toBeNull();
  });
});

describe("games", () => {
  it("lists a player's games from the newest", async () => {
    const user = await newUser();
    await insertGame(ctx.db, user.id, result(100));
    await insertGame(ctx.db, user.id, result(300));

    expect((await userGames(ctx.db, user.id)).map((g) => g.score)).toEqual([300, 100]);
  });

  it("ranks the best game of each active player and skips disabled players (R3)", async () => {
    await ctx.db.query("delete from games");
    const [a, b, c] = [await newUser("rank"), await newUser("rank"), await newUser("rank")];
    await insertGame(ctx.db, a.id, result(500));
    await insertGame(ctx.db, a.id, result(900));
    await insertGame(ctx.db, b.id, result(700));
    await insertGame(ctx.db, c.id, result(1000));
    await setDisabled(ctx.db, c.id, true);

    const board = await leaderboard(ctx.db);
    expect(board.map(({ rank, username, score }) => ({ rank, username, score }))).toEqual([
      { rank: 1, username: a.username, score: 900 },
      { rank: 2, username: b.username, score: 700 },
    ]);
  });

  it("deletes a single game", async () => {
    const user = await newUser();
    const id = await insertGame(ctx.db, user.id, result(10));

    expect(await deleteGame(ctx.db, id)).toBe(true);
    expect(await deleteGame(ctx.db, id)).toBe(false);
  });
});
