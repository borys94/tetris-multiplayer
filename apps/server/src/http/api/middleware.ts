import type { ErrorRequestHandler, RequestHandler } from 'express'
import type { Authenticate, AuthUser } from '../../accounts/authenticate'
import { log } from '../../observability/logger'

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Locals {
      /** Zalogowany użytkownik (ustawia `loadUser`). */
      user?: AuthUser
    }
  }
}

const MUTATING = new Set(['POST', 'PUT', 'PATCH', 'DELETE'])

/**
 * Ochrona CSRF (spec konta): każda zmiana stanu musi przyjść z naszej strony (`Origin`)
 * i jako JSON. Bez `allowedOrigin` (dev) sprawdzamy tylko typ treści.
 */
export const protectMutations = (allowedOrigin: string | undefined): RequestHandler => {
  return (req, res, next) => {
    if (!MUTATING.has(req.method)) {
      return next()
    }
    if (allowedOrigin && req.headers.origin !== allowedOrigin) {
      res.status(403).json({ error: 'origin' })
      return
    }
    const hasBody =
      req.headers['transfer-encoding'] !== undefined ||
      (req.headers['content-length'] ?? '0') !== '0'
    if (hasBody && !req.is('application/json')) {
      res.status(415).json({ error: 'json_required' })
      return
    }
    next()
  }
}

/** Uwierzytelnia żądanie cookie sesji i przedłuża sesję. */
export const loadUser = (authenticate: Authenticate): RequestHandler => {
  return async (req, res, next) => {
    const user = await authenticate(req)
    if (user) {
      res.locals.user = user
    }
    next()
  }
}

export const requireUser: RequestHandler = (_req, res, next) => {
  if (!res.locals.user) {
    res.status(401).json({ error: 'unauthenticated' })
    return
  }
  next()
}

export const requireAdmin: RequestHandler = (_req, res, next) => {
  if (!res.locals.user) {
    res.status(401).json({ error: 'unauthenticated' })
    return
  }
  if (res.locals.user.role !== 'admin') {
    res.status(403).json({ error: 'forbidden' })
    return
  }
  next()
}

/** Błędy bez szczegółów dla klienta; szczegóły tylko w logu serwera. */
// Express rozpoznaje obsługę błędów po 4 parametrach, więc `_next` musi zostać.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const handleErrors: ErrorRequestHandler = (error: unknown, _req, res, _next) => {
  const status =
    typeof error === 'object' && error !== null && 'status' in error ? Number(error.status) : 500
  if (status >= 500) {
    log.error({ err: error }, 'API error')
  }
  res.status(status >= 400 && status < 600 ? status : 500).json({
    error: status === 400 ? 'invalid' : status === 413 ? 'too_large' : 'internal',
  })
}
