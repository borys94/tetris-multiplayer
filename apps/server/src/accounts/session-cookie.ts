import { createHash, randomBytes } from "node:crypto";
import type { IncomingMessage } from "node:http";

export const COOKIE_NAME = "sid";
export const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000;

/** Nowy token sesji: wartość do cookie i jej SHA-256 do bazy. */
export function newSessionToken(): { token: string; hash: Buffer } {
  const token = randomBytes(32).toString("base64url");
  return { token, hash: hashToken(token) };
}

export function hashToken(token: string): Buffer {
  return createHash("sha256").update(token).digest();
}

/** Token sesji z nagłówka `Cookie` albo `null`. */
export function readSessionToken(req: IncomingMessage): string | null {
  const header = req.headers.cookie;
  if (!header) return null;
  for (const part of header.split(";")) {
    const [name, ...rest] = part.trim().split("=");
    if (name === COOKIE_NAME) {
      const value = rest.join("=");
      return /^[\w-]{43}$/.test(value) ? value : null;
    }
  }
  return null;
}

/** Nagłówek `Set-Cookie` z sesją (R1) albo usuwający ją, gdy `token` jest `null`. */
export function sessionCookie(token: string | null, secure: boolean): string {
  const attributes = [
    `${COOKIE_NAME}=${token ?? ""}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    `Max-Age=${token ? SESSION_TTL_MS / 1000 : 0}`,
  ];
  if (secure) attributes.push("Secure");
  return attributes.join("; ");
}
