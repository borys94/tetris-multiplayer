import { describe, expect, it } from "vitest";
import { hashPassword, temporaryPassword, verifyPassword } from "./passwords";

describe("passwords", () => {
  it("hashes with scrypt and a random salt, and verifies only the right password", async () => {
    const [a, b] = await Promise.all([
      hashPassword("secret password"),
      hashPassword("secret password"),
    ]);

    expect(a).toMatch(/^scrypt\$32768\$8\$1\$[\w+/=]+\$[\w+/=]+$/);
    expect(a).not.toBe(b);
    expect(await verifyPassword("secret password", a)).toBe(true);
    expect(await verifyPassword("Secret password", a)).toBe(false);
  });

  it("rejects malformed hashes", async () => {
    expect(await verifyPassword("x", "md5$abc")).toBe(false);
    expect(await verifyPassword("x", "")).toBe(false);
  });

  it("generates 16-character temporary passwords", () => {
    expect(temporaryPassword()).toMatch(/^[\w-]{16}$/);
  });
});
