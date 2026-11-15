import { once } from 'node:events'
import type { AddressInfo } from 'node:net'
import { Router } from 'express'
import request from 'supertest'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { metricValue } from '../support/metrics'
import { createApp } from '../../src/http/app'
import { routeLabel, statusClass } from '../../src/observability/access-log'
import { SessionStore } from '../../src/game/session-store'
import { startGameLoop } from '../../src/play/loop'
import {
  createMetricsServer,
  gamesFinished,
  httpRequests,
  registry,
  tickDuration,
  ticksDropped,
  trackGauge,
  trackPool,
} from '../../src/observability/metrics'

afterEach(() => {
  vi.useRealTimers()
})

describe('labels', () => {
  it('keeps route cardinality low', () => {
    expect(routeLabel('/api/admin/users/42/games', 200)).toBe('/api/admin/users/:id/games')
    expect(routeLabel('/api/admin/games/7', 204)).toBe('/api/admin/games/:id')
    expect(routeLabel('/api/random-path-123abc', 404)).toBe('unmatched')
    expect(routeLabel('/assets/index-abc.js', 200)).toBe('static')
    expect(routeLabel('/health', 200)).toBe('/health')
    expect(statusClass(201)).toBe('2xx')
    expect(statusClass(503)).toBe('5xx')
  })
})

describe('labelled counters', () => {
  it('start at 0 so increase() counts the first event', async () => {
    const text = await registry.metrics()
    expect(text).toContain('blockfall_games_finished_total{player="guest"} 0')
    expect(text).toContain('blockfall_logins_total{result="failure"} 0')
    expect(text).toContain('blockfall_ws_rejected_total{reason="origin"} 0')
  })
})

describe('metrics server', () => {
  it('serves Prometheus text on GET /metrics and nothing else (spec obserwowalnosc, S1)', async () => {
    trackGauge('blockfall_test_gauge', 'test', () => 7)
    trackPool({ totalCount: 3, idleCount: 2, waitingCount: 0 })
    const server = createMetricsServer().listen(0)
    await once(server, 'listening')
    const base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`

    const res = await fetch(`${base}/metrics`)
    const body = await res.text()
    expect(res.status).toBe(200)
    expect(res.headers.get('content-type')).toContain('text/plain')
    expect(body).toContain('blockfall_http_requests_total')
    expect(body).toContain('blockfall_nodejs_eventloop_lag_seconds')
    expect(body).toContain('blockfall_test_gauge 7')
    expect(body).toContain('blockfall_db_pool_connections{state="idle"} 2')
    expect((await fetch(`${base}/`)).status).toBe(404)

    server.close()
  })

  it('is not part of the public app (spec obserwowalnosc, S1)', async () => {
    const res = await request(createApp({ version: 'dev' })).get('/metrics')
    expect(res.status).toBe(404)
  })
})

describe('HTTP metrics', () => {
  it('counts requests by method, route and status class', async () => {
    const api = Router()
    api.get('/admin/users/:id', (_req, res) => {
      res.status(500).end()
    })
    const app = createApp({ version: 'dev', api })
    const labels = { method: 'GET', route: '/api/admin/users/:id', status: '5xx' }
    const before = await metricValue(httpRequests, labels)

    await request(app).get('/api/admin/users/1')
    await request(app).get('/api/admin/users/2?x=1')

    expect(await metricValue(httpRequests, labels)).toBe(before + 2)
  })
})

describe('game metrics', () => {
  it('counts finished games of guests and players', async () => {
    const store = new SessionStore(
      { bufferTicks: 0, maxAheadTicks: 60, maxSessions: 2, ttlMs: 1000 },
      () => 0,
    )
    const before = await metricValue(gamesFinished, { player: 'user' })
    const session = store.create()!
    session.userId = 5
    session.attach(() => {})
    session.resume()

    for (let seq = 1; seq < 500 && session.connected; seq++) {
      session.input(seq, seq - 1, ['hardDrop'])
      session.advance(1)
      if ((await metricValue(gamesFinished, { player: 'user' })) > before) {
        break
      }
    }

    expect(await metricValue(gamesFinished, { player: 'user' })).toBe(before + 1)
  })

  it('times every loop pass and counts ticks dropped after a stall', async () => {
    vi.useFakeTimers()
    const clock = { now: 0 }
    const store = new SessionStore(
      { bufferTicks: 9, maxAheadTicks: 60, maxSessions: 1, ttlMs: 1000 },
      () => clock.now,
    )
    const passes = await metricValue(tickDuration)
    const dropped = await metricValue(ticksDropped)
    const stop = startGameLoop({ sessions: store, now: () => clock.now })

    clock.now = 1001 // 60 ticków naraz, nadrabiamy najwyżej 30
    vi.advanceTimersByTime(9)
    stop()

    expect(await metricValue(tickDuration)).toBeGreaterThan(passes)
    expect(await metricValue(ticksDropped)).toBe(dropped + 30)
  })
})
