import { Router } from "express";
import { readSessionToken, sessionCookie } from "../../accounts/session-cookie";
import { userGames } from "../../db/games";
import { userMatches } from "../../db/matches";
import type { Db } from "../../db/pool";
import type { User } from "../../db/users";
import { requireUser } from "./middleware";

/** Odpowiedź z profilem; w panelu konta i w nagłówku strony. */
export function profile(user: Pick<User, "id" | "username" | "role">) {
  return { id: user.id, username: user.username, role: user.role };
}

/** Konto zalogowanego gracza pod `/me`: profil, historia gier (spec 005, R3) i meczów 1v1 (spec 007, R5). */
export function meRouter(db: Db, secureCookies: boolean): Router {
  const router = Router();

  router.get("/", requireUser, (req, res) => {
    // Odświeżamy cookie, żeby jego ważność szła razem z przedłużaną sesją.
    const token = readSessionToken(req);
    if (token) res.setHeader("Set-Cookie", sessionCookie(token, secureCookies));
    res.json({ user: profile(res.locals.user!) });
  });

  router.get("/games", requireUser, async (_req, res) => {
    res.json({ games: await userGames(db, res.locals.user!.id) });
  });

  router.get("/matches", requireUser, async (_req, res) => {
    res.json({ matches: await userMatches(db, res.locals.user!.id) });
  });

  return router;
}
