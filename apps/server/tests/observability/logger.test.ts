import { Writable } from 'node:stream'
import { Router } from 'express'
import request from 'supertest'
import { describe, expect, it } from 'vitest'
import { createApp } from '../../src/http/app'
import { createLogger } from '../../src/observability/logger'

/** Logger piszący do tablicy sparsowanych linii JSON. */
const memoryLogger = () => {
  const lines: Record<string, unknown>[] = []
  const raw: string[] = []
  const stream = new Writable({
    write(chunk: Buffer, _encoding, callback) {
      for (const line of chunk.toString().split('\n').filter(Boolean)) {
        raw.push(line)
        lines.push(JSON.parse(line) as Record<string, unknown>)
      }
      callback()
    },
  })
  const logger = createLogger({ env: 'beta', version: 'abc123', level: 'info' }, stream)
  return { logger, lines, raw }
}

describe('logger', () => {
  it('writes one JSON line with level, msg, env and version', () => {
    const { logger, lines } = memoryLogger()

    logger.info({ port: 3000 }, 'server listening')

    expect(lines).toHaveLength(1)
    expect(lines[0]).toMatchObject({
      level: 'info',
      msg: 'server listening',
      env: 'beta',
      version: 'abc123',
      port: 3000,
    })
    expect(typeof lines[0]?.time).toBe('string')
  })

  it('redacts passwords, tokens and cookies', () => {
    const { logger, raw } = memoryLogger()

    logger.info({ password: 'hunter2-secret', body: { password: 'p4ssword-x' } }, 'a')
    logger.info({ token: 'tok-123', req: { headers: { cookie: 'sid=abcdef' } } }, 'b')

    const out = raw.join('\n')
    for (const secret of ['hunter2-secret', 'p4ssword-x', 'tok-123', 'sid=abcdef']) {
      expect(out).not.toContain(secret)
    }
    expect(out).toContain('[redacted]')
  })

  it('serializes errors with message and stack', () => {
    const { logger, lines } = memoryLogger()

    logger.error({ err: new Error('boom') }, 'API error')

    expect(lines[0]).toMatchObject({ level: 'error', err: { message: 'boom', type: 'Error' } })
  })
})

describe('access log', () => {
  it('logs method, path without query, status and time, without cookies', async () => {
    const { logger, lines, raw } = memoryLogger()
    const api = Router()
    api.post('/login', (_req, res) => {
      res.status(401).json({ error: 'invalid' })
    })

    await request(createApp({ version: 'dev', api, logger }))
      .post('/api/login?next=x')
      .set('Cookie', 'sid=very-secret-token')
      .send({ username: 'ala', password: 'tajne-haslo-123' })

    expect(lines).toHaveLength(1)
    expect(lines[0]).toMatchObject({
      msg: 'http request',
      method: 'POST',
      path: '/api/login',
      status: 401,
    })
    expect(typeof lines[0]?.ms).toBe('number')
    expect(raw.join()).not.toContain('very-secret-token')
    expect(raw.join()).not.toContain('tajne-haslo-123')
  })

  it('skips health checks and logs 5xx as error', async () => {
    const { logger, lines } = memoryLogger()
    const api = Router()
    api.get('/fail', (_req, res) => {
      res.status(500).end()
    })
    const app = createApp({ version: 'dev', api, logger })

    await request(app).get('/health')
    await request(app).get('/api/fail')

    expect(lines).toHaveLength(1)
    expect(lines[0]).toMatchObject({ level: 'error', path: '/api/fail', status: 500 })
  })
})
