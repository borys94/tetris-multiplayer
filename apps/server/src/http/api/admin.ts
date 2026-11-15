import { Router, type Request, type Response } from 'express'
import { resetPassword, updateUser, type UserChanges } from '../../accounts/admin'
import { deleteGame, userGames } from '../../db/games'
import { listMatches } from '../../db/matches'
import type { Db } from '../../db/pool'
import { searchUsers } from '../../db/users'
import type { RoomInfo } from '../../rooms/room'
import { requireAdmin } from './middleware'

const MAX_QUERY = 20

/** Id z parametru ścieżki albo `null` (wtedy odpowiadamy 400). */
const idParam = (req: Request, res: Response): number | null => {
  const id = Number(req.params.id)
  if (Number.isSafeInteger(id) && id > 0) {
    return id
  }
  res.status(400).json({ error: 'invalid' })
  return null
}

const readChanges = (body: unknown): UserChanges | null => {
  if (typeof body !== 'object' || body === null) {
    return null
  }
  const { role, disabled } = body as Record<string, unknown>
  const changes: UserChanges = {}
  if (role !== undefined) {
    if (role !== 'admin' && role !== null) {
      return null
    }
    changes.role = role
  }
  if (disabled !== undefined) {
    if (typeof disabled !== 'boolean') {
      return null
    }
    changes.disabled = disabled
  }
  return Object.keys(changes).length > 0 ? changes : null
}

/** Źródło pokoi w pamięci serwera (spec panel-admina); bez niego lista jest pusta. */
export interface RoomsSource {
  list(): RoomInfo[]
}

/** Panel admina (spec panel-admina); dostęp tylko z rolą `admin`, sprawdzaną na serwerze. */
export const adminRouter = (db: Db, rooms?: RoomsSource): Router => {
  const router = Router()
  router.use(requireAdmin)

  router.get('/users', async (req, res) => {
    const query = typeof req.query.q === 'string' ? req.query.q.trim().toLowerCase() : ''
    res.json({ users: await searchUsers(db, query.slice(0, MAX_QUERY)) })
  })

  router.patch('/users/:id', async (req, res) => {
    const id = idParam(req, res)
    if (id === null) {
      return
    }
    const changes = readChanges(req.body)
    if (!changes) {
      res.status(400).json({ error: 'invalid' })
      return
    }
    const user = await updateUser(db, res.locals.user!.id, id, changes)
    if (user === 'cannot_change_self') {
      res.status(400).json({ error: user })
      return
    }
    if (user === 'not_found') {
      res.status(404).json({ error: user })
      return
    }
    res.json({ user })
  })

  router.post('/users/:id/password', async (req, res) => {
    const id = idParam(req, res)
    if (id === null) {
      return
    }
    const password = await resetPassword(db, id)
    if (password === null) {
      res.status(404).json({ error: 'not_found' })
      return
    }
    // Hasło tymczasowe pokazujemy adminowi tylko w tej odpowiedzi; nie trafia do logów.
    res.json({ password })
  })

  router.get('/users/:id/games', async (req, res) => {
    const id = idParam(req, res)
    if (id === null) {
      return
    }
    res.json({ games: await userGames(db, id) })
  })

  router.get('/rooms', (_req, res) => {
    res.json({ rooms: rooms?.list() ?? [] })
  })

  router.get('/matches', async (req, res) => {
    const query = typeof req.query.q === 'string' ? req.query.q.trim().slice(0, MAX_QUERY) : ''
    const before = Number(req.query.before)
    const matches = await listMatches(db, {
      query,
      ...(Number.isSafeInteger(before) && before > 0 ? { before } : {}),
    })
    res.json({ matches })
  })

  router.delete('/games/:id', async (req, res) => {
    const id = idParam(req, res)
    if (id === null) {
      return
    }
    if (!(await deleteGame(db, id))) {
      res.status(404).json({ error: 'not_found' })
      return
    }
    res.status(204).end()
  })

  return router
}
