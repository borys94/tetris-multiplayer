import { describe, expect, it } from "vitest";
import { useTestDatabase } from "../support/db";
import { createSession, useSession } from "../../src/db/sessions";
import { createUser, findUserByUsername } from "../../src/db/users";
import { resetPassword, updateUser } from "../../src/accounts/admin";
import { verifyPassword } from "../../src/accounts/passwords";

const ctx = useTestDatabase();
const inDay = () => new Date(Date.now() + 24 * 60 * 60 * 1000);

let counter = 0;
async function userWithSession() {
  const user = (await createUser(ctx.db, `admin-svc${++counter}`, "hash"))!;
  const token = Buffer.from(`token-${user.id}`);
  await createSession(ctx.db, token, user.id, inDay());
  return { user, token };
}

describe("updateUser (spec 005, R4)", () => {
  it("changes role and block together and logs a blocked account out everywhere", async () => {
    const { user, token } = await userWithSession();

    const updated = await updateUser(ctx.db, 999_999, user.id, { role: "admin", disabled: true });
    expect(updated).toMatchObject({ id: user.id, role: "admin", disabled: true });
    const { rowCount } = await ctx.db.query("select 1 from sessions where user_id = $1", [user.id]);
    expect(rowCount).toBe(0);

    await updateUser(ctx.db, 999_999, user.id, { disabled: false });
    await createSession(ctx.db, token, user.id, inDay());
    expect(await useSession(ctx.db, token, inDay())).not.toBeNull();
  });

  it("does not let admins demote or block themselves", async () => {
    const { user } = await userWithSession();
    expect(await updateUser(ctx.db, user.id, user.id, { role: null })).toBe("cannot_change_self");
    expect(await updateUser(ctx.db, user.id, user.id, { disabled: true })).toBe(
      "cannot_change_self",
    );
    expect(await updateUser(ctx.db, user.id, user.id, { role: "admin" })).toMatchObject({
      role: "admin",
    });
  });

  it("reports a missing account", async () => {
    expect(await updateUser(ctx.db, 1, 999_999, { role: "admin" })).toBe("not_found");
  });
});

describe("resetPassword", () => {
  it("sets a temporary password and logs the account out everywhere", async () => {
    const { user, token } = await userWithSession();

    const password = await resetPassword(ctx.db, user.id);
    expect(password).toEqual(expect.any(String));
    const stored = await findUserByUsername(ctx.db, user.username);
    expect(await verifyPassword(password!, stored!.passwordHash)).toBe(true);
    expect(await useSession(ctx.db, token, inDay())).toBeNull();
  });

  it("returns null for a missing account", async () => {
    expect(await resetPassword(ctx.db, 999_999)).toBeNull();
  });
});
