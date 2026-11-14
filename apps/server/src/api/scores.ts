import { Router } from "express";
import { leaderboard, userGames } from "../db/games";
import type { Db } from "../db/pool";
import { requireUser } from "./middleware";

/** Ranking (publiczny) i historia gier zalogowanego gracza (R3). */
export function scoresRouter(db: Db): Router {
  const router = Router();

  router.get("/leaderboard", async (_req, res) => {
    res.json({ entries: await leaderboard(db) });
  });

  router.get("/me/games", requireUser, async (_req, res) => {
    res.json({ games: await userGames(db, res.locals.user!.id) });
  });

  return router;
}
