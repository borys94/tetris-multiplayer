import { describe, expect, it } from 'vitest'
import { loadConfig } from '../src/config'

const DB = 'postgres://localhost/blockfall'

describe('loadConfig', () => {
  it('uses a 150 ms input buffer (9 ticks) and safe defaults', () => {
    expect(loadConfig({ DATABASE_URL: DB })).toEqual({
      port: 3000,
      metricsPort: 9464,
      version: 'dev',
      trustProxy: false,
      bufferTicks: 9,
      maxSessions: 200,
      maxRooms: 50,
      drainTimeoutMs: 280_000,
      sessionTtlMs: 60_000,
      maxConnectionsPerIp: 5,
      databaseUrl: DB,
      secureCookies: true,
      maxAheadTicks: 60,
      messagesPerSecond: 90,
      messageBurst: 120,
      heartbeatMs: 15_000,
      sessionCleanupMs: 3_600_000,
    })
  })

  it('reads overrides from the environment', () => {
    const config = loadConfig({
      DATABASE_URL: DB,
      COOKIE_SECURE: 'false',
      INPUT_BUFFER_MS: '250',
      ALLOWED_ORIGIN: 'https://game.example',
      TRUST_PROXY: 'true',
      STATIC_DIR: '/app/public',
    })

    expect(config).toMatchObject({
      bufferTicks: 15,
      allowedOrigin: 'https://game.example',
      trustProxy: true,
      staticDir: '/app/public',
      secureCookies: false,
    })
  })

  it('fails fast on invalid numbers', () => {
    expect(() => loadConfig({ DATABASE_URL: DB, INPUT_BUFFER_MS: 'fast' })).toThrow(
      /INPUT_BUFFER_MS/,
    )
    expect(() => loadConfig({})).toThrow(/DATABASE_URL/)
  })
})
