import { Router } from "express";
import { leaderboard, userGames } from "../db/games";
import { userMatches } from "../db/matches";
import type { Db } from "../db/pool";
import { requireUser } from "./middleware";

/** Ranking (publiczny), historia gier (spec 005, R3) i meczów 1v1 (spec 007, R5) zalogowanego gracza. */
export function scoresRouter(db: Db): Router {
  const router = Router();

  router.get("/leaderboard", async (_req, res) => {
    res.json({ entries: await leaderboard(db) });
  });

  router.get("/me/games", requireUser, async (_req, res) => {
    res.json({ games: await userGames(db, res.locals.user!.id) });
  });

  router.get("/me/matches", requireUser, async (_req, res) => {
    res.json({ matches: await userMatches(db, res.locals.user!.id) });
  });

  return router;
}
