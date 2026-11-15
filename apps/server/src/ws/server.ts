import type { IncomingMessage, Server } from 'node:http'
import type { Duplex } from 'node:stream'
import { MAX_MESSAGE_BYTES } from '@tetris/protocol'
import { WebSocketServer } from 'ws'
import type { Authenticate } from '../accounts/authenticate'
import { log } from '../observability/logger'
import { wsConnections, wsRejected } from '../observability/metrics'
import type { Players } from '../play/players'
import { clientIp } from './client-ip'
import { Connection, type MessageLimits } from './connection'

export interface WsOptions extends MessageLimits {
  /** Gracze, sesje gry i pokoje 1v1. */
  players: Players
  /** Dozwolony nagłówek `Origin`, np. `https://example.com`; bez niego nie sprawdzamy (dev). */
  allowedOrigin?: string
  /** Czy brać IP klienta z `X-Forwarded-For` (za Traefikiem). */
  trustProxy: boolean
  /** Limit połączeń z jednego IP; 0 wyłącza limit (np. gdy proxy nie przekazuje IP klienta). */
  maxConnectionsPerIp: number
  heartbeatMs: number
  /** Użytkownik z cookie sesji (spec konta, R4); bez niego wszyscy grają jako goście. */
  authenticate?: Authenticate
}

export const WS_PATH = '/ws'

const CLOSE_GOING_AWAY = 1001
/** Serwer się restartuje (deploy): klient łączy się ponownie, już z nowym podem. */
const CLOSE_SERVICE_RESTART = 1012

const reject = (socket: Duplex, status: number, reason: string): void => {
  socket.end(`HTTP/1.1 ${status} ${reason}\r\nConnection: close\r\n\r\n`)
}

/** Wywołanie zamyka wszystkie połączenia; `drain()` przygotowuje serwer do deployu. */
export type WsHandle = (() => void) & {
  /**
   * Odrzuca nowe połączenia i zamyka te, które nie są w trwającym meczu (klient łączy się
   * ponownie, już z nowym podem). Wołane wielokrotnie zamyka połączenia graczy po końcu meczu.
   */
  drain(): void
}

/**
 * Podpina endpoint `/ws` pod serwer HTTP (ten sam port co Express, ADR-0007): kontrola
 * upgrade'u (ścieżka, Origin, limit na IP, drain), uwierzytelnienie i heartbeat.
 * Zwraca funkcję zamykającą wszystkie połączenia (np. przy SIGTERM) z metodą `drain`.
 */
export const attachWebSocket = (server: Server, options: WsOptions): WsHandle => {
  let draining = false
  const wss = new WebSocketServer({ noServer: true, maxPayload: MAX_MESSAGE_BYTES })
  const connectionsPerIp = new Map<string, number>()
  const connections = new Set<Connection>()

  server.on('upgrade', (req: IncomingMessage, socket: Duplex, head: Buffer) => {
    void upgrade(req, socket, head)
  })

  const upgrade = async (req: IncomingMessage, socket: Duplex, head: Buffer): Promise<void> => {
    const path = new URL(req.url ?? '/', 'http://localhost').pathname
    if (path !== WS_PATH) {
      return reject(socket, 404, 'Not Found')
    }
    if (draining) {
      wsRejected.inc({ reason: 'draining' })
      return reject(socket, 503, 'Service Unavailable')
    }
    if (options.allowedOrigin && req.headers.origin !== options.allowedOrigin) {
      wsRejected.inc({ reason: 'origin' })
      return reject(socket, 403, 'Forbidden')
    }
    const ip = clientIp(req, options.trustProxy)
    const count = connectionsPerIp.get(ip) ?? 0
    if (options.maxConnectionsPerIp > 0 && count >= options.maxConnectionsPerIp) {
      wsRejected.inc({ reason: 'ip_limit' })
      return reject(socket, 429, 'Too Many Requests')
    }

    connectionsPerIp.set(ip, count + 1)
    const release = () => {
      const left = (connectionsPerIp.get(ip) ?? 1) - 1
      if (left > 0) {
        connectionsPerIp.set(ip, left)
      } else {
        connectionsPerIp.delete(ip)
      }
    }
    // Błąd bazy przy odczycie sesji nie blokuje gry: gracz gra wtedy jako gość.
    const user = await options.authenticate?.(req).catch((error: unknown) => {
      log.error({ err: error }, 'WebSocket auth error')
      return null
    })
    if (socket.destroyed) {
      return release()
    }

    wss.handleUpgrade(req, socket, head, (ws) => {
      const connection = new Connection(
        ws,
        user ? { id: user.id, username: user.username } : null,
        options.players,
        options,
      )
      connections.add(connection)
      wsConnections.inc()
      ws.on('message', (data, isBinary) => connection.receive(data, isBinary))
      ws.on('pong', () => (connection.alive = true))
      ws.on('error', () => ws.terminate())
      ws.on('close', () => {
        connections.delete(connection)
        wsConnections.dec()
        connection.close()
        release()
      })
    })
  }

  // Heartbeat: połączenie, które nie odpowiedziało na poprzedni ping, zamykamy.
  const heartbeat = setInterval(() => {
    for (const connection of connections) {
      if (!connection.alive) {
        connection.ws.terminate()
        continue
      }
      connection.alive = false
      connection.ws.ping()
    }
  }, options.heartbeatMs)

  const close = () => {
    clearInterval(heartbeat)
    for (const connection of connections) {
      connection.ws.close(CLOSE_GOING_AWAY, 'shutdown')
    }
    wss.close()
  }
  const drain = () => {
    draining = true
    for (const connection of connections) {
      if (!connection.inMatch) {
        connection.ws.close(CLOSE_SERVICE_RESTART, 'restart')
      }
    }
  }
  return Object.assign(close, { drain })
}
