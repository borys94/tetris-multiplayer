import type { Server } from 'node:http'
import type { Db } from './db/pool'
import { deleteExpiredSessions } from './db/sessions'
import { log } from './observability/logger'
import type { RoomStore } from './rooms/room-store'
import type { WsHandle } from './ws/server'

/** Co trzeba zatrzymać przy zamykaniu procesu, w tej kolejności. */
export interface Lifecycle {
  db: Db
  server: Server
  metricsServer: Server | null
  ws: WsHandle
  rooms: RoomStore
  stopLoop: () => void
  /** Jak długo po SIGTERM pod dogrywa trwające mecze. */
  drainTimeoutMs: number
  /** Co ile ms usuwamy wygasłe sesje logowania. */
  sessionCleanupMs: number
  /** Wołane na początku drenowania (`/ready` zaczyna zwracać 503). */
  onDrain: () => void
}

/** Sprzątanie wygasłych sesji logowania; zwraca funkcję, która je zatrzymuje. */
const startSessionCleanup = (db: Db, intervalMs: number): (() => void) => {
  const cleanup = setInterval(() => {
    deleteExpiredSessions(db).catch((error: unknown) =>
      log.error({ err: error }, 'session cleanup failed'),
    )
  }, intervalMs)
  return () => clearInterval(cleanup)
}

/**
 * Obsługa sygnałów procesu. Deploy (spec infrastruktura): Kubernetes wysyła SIGTERM, gdy nowy pod jest
 * już gotowy. Stary pod przestaje być `ready`, odsyła graczy spoza meczów do nowego
 * (zamknięcie WebSocketu i ponowne połączenie) i czeka, aż skończą się trwające mecze,
 * najdłużej `drainTimeoutMs`. Ctrl+C (SIGINT) i drugi SIGTERM zamykają serwer od razu.
 */
export const handleSignals = (lifecycle: Lifecycle): void => {
  const { db, server, metricsServer, ws, rooms, stopLoop, drainTimeoutMs } = lifecycle
  const stopCleanup = startSessionCleanup(db, lifecycle.sessionCleanupMs)
  let draining = false

  const shutdown = () => {
    stopCleanup()
    stopLoop()
    ws()
    metricsServer?.close()
    server.close(() => {
      void db.end().finally(() => process.exit(0))
    })
  }

  const drain = () => {
    if (draining) {
      return shutdown()
    }
    draining = true
    lifecycle.onDrain()
    rooms.drain()
    ws.drain()
    const deadline = Date.now() + drainTimeoutMs
    log.info({ matches: rooms.playing, timeoutMs: drainTimeoutMs }, 'draining')
    const check = setInterval(() => {
      ws.drain()
      if (rooms.playing > 0 && Date.now() < deadline) {
        return
      }
      clearInterval(check)
      log.info({ unfinishedMatches: rooms.playing }, 'drained, shutting down')
      shutdown()
    }, 1000)
  }

  process.on('SIGINT', shutdown)
  process.on('SIGTERM', drain)
}
