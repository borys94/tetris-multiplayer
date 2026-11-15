import { mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import request from 'supertest'
import { describe, expect, it } from 'vitest'
import { createApp } from '../../src/http/app'

describe('GET /health', () => {
  it('returns ok with the app version', async () => {
    const res = await request(createApp({ version: 'abc123' })).get('/health')

    expect(res.status).toBe(200)
    expect(res.body).toEqual({ status: 'ok', version: 'abc123' })
  })
})

describe('GET /ready', () => {
  it('is ready by default and returns 503 while the pod drains matches (spec infrastruktura)', async () => {
    let ready = true
    const app = createApp({ version: 'dev', isReady: () => ready })

    expect((await request(app).get('/ready')).status).toBe(200)
    ready = false
    const res = await request(app).get('/ready')
    expect(res.status).toBe(503)
    expect(res.body).toEqual({ status: 'draining' })
    expect((await request(app).get('/health')).status).toBe(200)
  })
})

describe('static frontend', () => {
  const staticDir = mkdtempSync(join(tmpdir(), 'tetris-web-'))
  writeFileSync(join(staticDir, 'index.html'), '<!doctype html><title>game</title>')

  it('serves index.html at the root', async () => {
    const res = await request(createApp({ version: 'dev', staticDir })).get('/')

    expect(res.status).toBe(200)
    expect(res.text).toContain('<title>game</title>')
  })

  it('serves index.html for web routes, so the router can show the view', async () => {
    const app = createApp({ version: 'dev', staticDir })

    for (const path of ['/ranking', '/pokoj/ABC123']) {
      const res = await request(app).get(path)
      expect(res.status).toBe(200)
      expect(res.text).toContain('<title>game</title>')
    }
    expect((await request(app).get('/api/missing')).status).toBe(404)
  })

  it('returns 404 for missing files and without a static dir', async () => {
    expect(
      (await request(createApp({ version: 'dev', staticDir })).get('/missing.js')).status,
    ).toBe(404)
    expect((await request(createApp({ version: 'dev' })).get('/')).status).toBe(404)
  })
})
