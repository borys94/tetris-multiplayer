import { createServer } from 'node:http'
import { authenticator } from './accounts/authenticate'
import { runCli } from './cli'
import { loadConfig } from './config'
import { migrateWhenReady } from './db/migrate'
import { createPool } from './db/pool'
import { SessionStore } from './game/session-store'
import { createApi } from './http/api'
import { createApp } from './http/app'
import { handleSignals } from './lifecycle'
import { log } from './observability/logger'
import { createMetricsServer, trackGauge, trackPool, trackRooms } from './observability/metrics'
import { startGameLoop } from './play/loop'
import { Players } from './play/players'
import { saveGameResult, saveMatchResult } from './play/results'
import { RoomStore } from './rooms/room-store'
import { attachWebSocket } from './ws/server'

/** Składa serwer z modułów; logika jest w modułach, tu tylko zależności między nimi. */
const main = async (): Promise<void> => {
  const config = loadConfig(process.env)
  const { version, staticDir } = config
  const allowedOrigin = config.allowedOrigin ? { allowedOrigin: config.allowedOrigin } : {}

  const db = createPool(config.databaseUrl)
  const migrated = await migrateWhenReady(db)
  if (migrated.length > 0) {
    log.info({ migrations: migrated }, 'applied migrations')
  }

  // `node main.cjs <komenda>`: komenda administracyjna zamiast serwera.
  const args = process.argv.slice(2)
  if (args.length > 0) {
    const code = await runCli(db, args)
    await db.end()
    process.exit(code)
  }

  const saveMatch = saveMatchResult(db)
  const rooms = new RoomStore({
    bufferTicks: config.bufferTicks,
    maxAheadTicks: config.maxAheadTicks,
    ttlMs: config.sessionTtlMs,
    maxRooms: config.maxRooms,
    onMatchEnd: (result) => void saveMatch(result),
  })
  const saveResult = saveGameResult(db)
  const sessions = new SessionStore({
    bufferTicks: config.bufferTicks,
    maxAheadTicks: config.maxAheadTicks,
    maxSessions: config.maxSessions,
    ttlMs: config.sessionTtlMs,
    onGameOver: (session, result) => void saveResult(session, result),
  })
  const stopLoop = startGameLoop({ sessions, rooms })

  let draining = false
  const api = createApi({ db, rooms, secureCookies: config.secureCookies, ...allowedOrigin })
  const isReady = () => !draining
  const app = createApp(
    staticDir ? { version, staticDir, api, isReady } : { version, api, isReady },
  )
  const server = createServer(app)
  const ws = attachWebSocket(server, {
    players: new Players(sessions, rooms),
    ...allowedOrigin,
    trustProxy: config.trustProxy,
    maxConnectionsPerIp: config.maxConnectionsPerIp,
    messagesPerSecond: config.messagesPerSecond,
    messageBurst: config.messageBurst,
    heartbeatMs: config.heartbeatMs,
    authenticate: authenticator(db),
  })

  trackRooms(() => rooms.countByState())
  trackGauge(
    'blockfall_game_sessions',
    'Sesje gry w pamięci (także czekające na wznowienie)',
    () => sessions.size,
  )
  trackPool(db)
  const metricsServer = config.metricsPort > 0 ? createMetricsServer() : null
  metricsServer?.listen(config.metricsPort, () => {
    log.info({ port: config.metricsPort }, 'metrics listening')
  })

  server.listen(config.port, () => {
    log.info({ port: config.port, bufferTicks: config.bufferTicks }, 'server listening')
  })

  handleSignals({
    db,
    server,
    metricsServer,
    ws,
    rooms,
    stopLoop,
    drainTimeoutMs: config.drainTimeoutMs,
    sessionCleanupMs: config.sessionCleanupMs,
    onDrain: () => (draining = true),
  })
}

main().catch((error: unknown) => {
  log.fatal({ err: error }, 'server failed to start')
  process.exit(1)
})
