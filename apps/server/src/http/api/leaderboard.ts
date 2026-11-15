import { Router } from 'express'
import { leaderboard } from '../../db/games'
import type { Db } from '../../db/pool'

/** Publiczny ranking (spec ranking-historia, R3). */
export const leaderboardRouter = (db: Db): Router => {
  const router = Router()
  router.get('/', async (_req, res) => {
    res.json({ entries: await leaderboard(db) })
  })
  return router
}
