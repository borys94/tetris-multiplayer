import { Router, type Response } from "express";
import {
  PASSWORD_MAX,
  normalizeUsername,
  validPassword,
  validUsername,
} from "../../accounts/credentials";
import type { LoginLimiter } from "../../accounts/login-limiter";
import { dummyHash, hashPassword, verifyPassword } from "../../accounts/passwords";
import {
  SESSION_TTL_MS,
  hashToken,
  newSessionToken,
  readSessionToken,
  sessionCookie,
} from "../../accounts/session-cookie";
import type { Db } from "../../db/pool";
import { createSession, deleteSession } from "../../db/sessions";
import { createUser, findUserByUsername, publicUser } from "../../db/users";
import { logins, registrations } from "../../observability/metrics";
import { profile } from "./me";

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
  return { username: normalizeUsername(username), password };
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
    if (!credentials || !validUsername(credentials.username)) {
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
    registrations.inc();
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
      logins.inc({ result: "locked" });
      res.status(429).json({ error: "too_many_attempts" });
      return;
    }

    const user = await findUserByUsername(db, username);
    // Hasło sprawdzamy zawsze, także dla nieistniejącego loginu, żeby czas odpowiedzi go nie zdradzał.
    const valid = await verifyPassword(password, user?.passwordHash ?? (await dummyHash()));
    if (!user || !valid) {
      limiter.fail(username);
      logins.inc({ result: "failure" });
      res.status(401).json({ error: "invalid_credentials" });
      return;
    }
    limiter.succeed(username);
    if (user.disabled) {
      logins.inc({ result: "disabled" });
      res.status(403).json({ error: "account_disabled" });
      return;
    }
    await startSession(res, user.id);
    logins.inc({ result: "success" });
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
