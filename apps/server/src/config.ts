import { TICKS_PER_SECOND } from '@tetris/game-core'

export interface Config {
  port: number
  /** Port serwera metryk Prometheusa (spec obserwowalnosc); 0 go wyłącza. */
  metricsPort: number
  version: string
  staticDir?: string
  allowedOrigin?: string
  trustProxy: boolean
  /** Bufor wejścia w tickach (ADR-0006), liczony z `INPUT_BUFFER_MS`. */
  bufferTicks: number
  maxSessions: number
  /** Limit otwartych pokoi 1v1 (spec versus-1v1). */
  maxRooms: number
  /**
   * Jak długo po SIGTERM pod dogrywa trwające mecze (spec infrastruktura); musi być krótszy niż
   * `terminationGracePeriodSeconds`, żeby zdążyć zamknąć się samemu.
   */
  drainTimeoutMs: number
  sessionTtlMs: number
  /** 0 wyłącza limit połączeń na IP. */
  maxConnectionsPerIp: number
  /** Adres Postgresa (konta, sesje, wyniki). */
  databaseUrl: string
  /** Flaga `Secure` cookie sesji; wyłączana tylko lokalnie po HTTP w przeglądarkach bez wyjątku dla localhost. */
  secureCookies: boolean
  /** O ile ticków akcja klienta może wyprzedzać zegar serwera (1 s). */
  maxAheadTicks: number
  /** Limit wiadomości WebSocket na połączenie: średnio na sekundę i chwilowy zapas. */
  messagesPerSecond: number
  messageBurst: number
  /** Co ile ms pingujemy połączenia WebSocket. */
  heartbeatMs: number
  /** Co ile ms usuwamy wygasłe sesje logowania. */
  sessionCleanupMs: number
}

export interface LoggerConfig {
  /** Środowisko (`beta`, `prod`, `dev`) w każdej linii logu. */
  env: string
  /** Wersja aplikacji (SHA commita) w każdej linii logu. */
  version: string
  level: string
}

/** Domyślny bufor wejścia; do rewizji po M6 na podstawie wahań opóźnienia (ADR-0006). */
export const DEFAULT_INPUT_BUFFER_MS = 150

const positiveInt = (env: NodeJS.ProcessEnv, name: string, fallback: number): number => {
  const raw = env[name]
  if (raw === undefined || raw === '') {
    return fallback
  }
  const value = Number(raw)
  if (!Number.isInteger(value) || value < 0) {
    throw new Error(`${name} musi być nieujemną liczbą całkowitą, jest: ${raw}`)
  }
  return value
}

const required = (env: NodeJS.ProcessEnv, name: string): string => {
  const value = env[name]
  if (!value) {
    throw new Error(`Brak zmiennej środowiskowej ${name}`)
  }
  return value
}

export const loadConfig = (env: NodeJS.ProcessEnv): Config => {
  const bufferMs = positiveInt(env, 'INPUT_BUFFER_MS', DEFAULT_INPUT_BUFFER_MS)
  return {
    port: positiveInt(env, 'PORT', 3000),
    metricsPort: positiveInt(env, 'METRICS_PORT', 9464),
    version: env.APP_VERSION ?? 'dev',
    ...(env.STATIC_DIR ? { staticDir: env.STATIC_DIR } : {}),
    ...(env.ALLOWED_ORIGIN ? { allowedOrigin: env.ALLOWED_ORIGIN } : {}),
    trustProxy: env.TRUST_PROXY === 'true',
    bufferTicks: Math.round((bufferMs / 1000) * TICKS_PER_SECOND),
    maxSessions: positiveInt(env, 'MAX_SESSIONS', 200),
    maxRooms: positiveInt(env, 'MAX_ROOMS', 50),
    drainTimeoutMs: positiveInt(env, 'DRAIN_TIMEOUT_MS', 280_000),
    sessionTtlMs: positiveInt(env, 'SESSION_TTL_MS', 60_000),
    maxConnectionsPerIp: positiveInt(env, 'MAX_CONNECTIONS_PER_IP', 5),
    databaseUrl: required(env, 'DATABASE_URL'),
    secureCookies: env.COOKIE_SECURE !== 'false',
    maxAheadTicks: TICKS_PER_SECOND,
    messagesPerSecond: 90,
    messageBurst: 120,
    heartbeatMs: 15_000,
    sessionCleanupMs: 60 * 60 * 1000,
  }
}

/** Logger procesu powstaje przy imporcie (zanim `main` wczyta resztę), więc ma osobną funkcję. */
export const loadLoggerConfig = (env: NodeJS.ProcessEnv): LoggerConfig => {
  return {
    env: env.APP_ENV ?? 'dev',
    version: env.APP_VERSION ?? 'dev',
    level: env.LOG_LEVEL ?? (env.VITEST ? 'silent' : 'info'),
  }
}
