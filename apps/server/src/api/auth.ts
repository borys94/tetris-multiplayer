import { Router, type Response } from "express";
import { LoginLimiter } from "../auth/login-limiter";
import {
  PASSWORD_MAX,
  PASSWORD_MIN,
  USERNAME_PATTERN,
  dummyHash,
  hashPassword,
  verifyPassword,
} from "../auth/passwords";
import {
  SESSION_TTL_MS,
  hashToken,
  newSessionToken,
  readSessionToken,
  sessionCookie,
} from "../auth/session-cookie";
import type { Db } from "../db/pool";
import { createSession, deleteSession } from "../db/sessions";
import { createUser, findUserByUsername, publicUser, type User } from "../db/users";
import { requireUser } from "./middleware";

export interface AuthOptions {
  db: Db;
  limiter: LoginLimiter;
  secureCookies: boolean;
}

interface Credentials {
  username: string;
  password: string;
}

/** Login i hasło z treści żądania; login sprowadzamy do małych liter. */
function readCredentials(body: unknown): Credentials | null {
  if (typeof body !== "object" || body === null) return null;
  const { username, password } = body as Record<string, unknown>;
  if (typeof username !== "string" || typeof password !== "string") return null;
  return { username: username.trim().toLowerCase(), password };
}

function validPassword(password: string): boolean {
  return password.length >= PASSWORD_MIN && password.length <= PASSWORD_MAX;
}

/** Odpowiedź z profilem; w panelu konta i w nagłówku strony. */
export function profile(user: Pick<User, "id" | "username" | "role">) {
  return { id: user.id, username: user.username, role: user.role };
}

export function authRouter({ db, limiter, secureCookies }: AuthOptions): Router {
  const router = Router();

  async function startSession(res: Response, userId: number): Promise<void> {
    const { token, hash } = newSessionToken();
    await createSession(db, hash, userId, new Date(Date.now() + SESSION_TTL_MS));
    res.setHeader("Set-Cookie", sessionCookie(token, secureCookies));
  }

  router.post("/register", async (req, res) => {
    const credentials = readCredentials(req.body);
    if (!credentials || !USERNAME_PATTERN.test(credentials.username)) {
      res.status(400).json({ error: "invalid_username" });
      return;
    }
    if (!validPassword(credentials.password)) {
      res.status(400).json({ error: "invalid_password" });
      return;
    }
    const user = await createUser(
      db,
      credentials.username,
      await hashPassword(credentials.password),
    );
    if (!user) {
      res.status(409).json({ error: "username_taken" });
      return;
    }
    await startSession(res, user.id);
    res.status(201).json({ user: profile(user) });
  });

  router.post("/login", async (req, res) => {
    const credentials = readCredentials(req.body);
    if (!credentials || credentials.password.length > PASSWORD_MAX) {
      res.status(400).json({ error: "invalid" });
      return;
    }
    const { username, password } = credentials;
    const retryAfter = limiter.retryAfterMs(username);
    if (retryAfter > 0) {
      res.setHeader("Retry-After", String(Math.ceil(retryAfter / 1000)));
      res.status(429).json({ error: "too_many_attempts" });
      return;
    }

    const user = await findUserByUsername(db, username);
    // Hasło sprawdzamy zawsze, także dla nieistniejącego loginu, żeby czas odpowiedzi go nie zdradzał.
    const valid = await verifyPassword(password, user?.passwordHash ?? (await dummyHash()));
    if (!user || !valid) {
      limiter.fail(username);
      res.status(401).json({ error: "invalid_credentials" });
      return;
    }
    limiter.succeed(username);
    if (user.disabled) {
      res.status(403).json({ error: "account_disabled" });
      return;
    }
    await startSession(res, user.id);
    res.json({ user: profile(publicUser(user)) });
  });

  router.post("/logout", async (req, res) => {
    const token = readSessionToken(req);
    if (token) await deleteSession(db, hashToken(token));
    res.setHeader("Set-Cookie", sessionCookie(null, secureCookies));
    res.status(204).end();
  });

  return router;
}

export function meRouter(secureCookies: boolean): Router {
  const router = Router();
  router.get("/", requireUser, (req, res) => {
    // Odświeżamy cookie, żeby jego ważność szła razem z przedłużaną sesją.
    const token = readSessionToken(req);
    if (token) res.setHeader("Set-Cookie", sessionCookie(token, secureCookies));
    res.json({ user: profile(res.locals.user!) });
  });
  return router;
}
