import type { IncomingMessage } from 'node:http'
import type { Db } from '../db/pool'
import { useSession, type SessionUser } from '../db/sessions'
import { SESSION_TTL_MS, hashToken, readSessionToken } from './session-cookie'

/** Zalogowany użytkownik widziany przez API i WebSocket. */
export type AuthUser = SessionUser

export type Authenticate = (req: IncomingMessage) => Promise<AuthUser | null>

/**
 * Użytkownik z cookie sesji albo `null` (gość). Ważna sesja przedłuża się przy każdym
 * użyciu (spec konta); wspólne dla żądań API i upgrade'u WebSocketu.
 */
export const authenticator = (db: Db): Authenticate => {
  return async (req) => {
    const token = readSessionToken(req)
    if (!token) {
      return null
    }
    return useSession(db, hashToken(token), new Date(Date.now() + SESSION_TTL_MS))
  }
}
