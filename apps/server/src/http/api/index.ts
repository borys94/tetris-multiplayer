import express, { Router } from 'express'
import { authenticator } from '../../accounts/authenticate'
import { LoginLimiter } from '../../accounts/login-limiter'
import type { Db } from '../../db/pool'
import { adminRouter, type RoomsSource } from './admin'
import { authRouter } from './auth'
import { leaderboardRouter } from './leaderboard'
import { meRouter } from './me'
import { handleErrors, loadUser, protectMutations } from './middleware'

export interface ApiOptions {
  db: Db
  /** Dozwolony `Origin` dla zmian stanu; bez niego (dev) nie sprawdzamy. */
  allowedOrigin?: string
  secureCookies: boolean
  limiter?: LoginLimiter
  /** Pokoje 1v1 do podglądu w panelu admina (spec panel-admina). */
  rooms?: RoomsSource
}

/** API pod `/api` (spec konta, ranking-historia, panel-admina). */
export const createApi = ({
  db,
  allowedOrigin,
  secureCookies,
  limiter = new LoginLimiter(),
  rooms,
}: ApiOptions): Router => {
  const api = Router()
  api.use(protectMutations(allowedOrigin))
  api.use(express.json({ limit: '4kb' }))
  api.use(loadUser(authenticator(db)))

  api.use('/auth', authRouter({ db, limiter, secureCookies }))
  api.use('/leaderboard', leaderboardRouter(db))
  api.use('/me', meRouter(db, secureCookies))
  api.use('/admin', adminRouter(db, rooms))

  api.use((_req, res) => {
    res.status(404).json({ error: 'not_found' })
  })
  api.use(handleErrors)
  return api
}
