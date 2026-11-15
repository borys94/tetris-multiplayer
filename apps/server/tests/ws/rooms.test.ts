import { once } from 'node:events'
import { createServer, type Server } from 'node:http'
import type { AddressInfo } from 'node:net'
import { COUNTDOWN_MS, PROTOCOL_VERSION } from '@tetris/protocol'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { WebSocket } from 'ws'
import { connectClient, type TestClient } from '../support/ws-client'
import { SessionStore } from '../../src/game/session-store'
import { Players } from '../../src/play/players'
import { RoomStore } from '../../src/rooms/room-store'
import { attachWebSocket, type WsHandle } from '../../src/ws/server'

const ORIGIN = 'https://game.example'
const USERS: Record<string, { id: number; username: string; role: null }> = {
  'sid=ala': { id: 1, username: 'ala', role: null },
  'sid=bob': { id: 2, username: 'bob', role: null },
}

let server: Server
let rooms: RoomStore
let close: WsHandle
let now = 0

beforeEach(async () => {
  now = 1_000_000
  rooms = new RoomStore(
    { bufferTicks: 3, maxAheadTicks: 60, ttlMs: 60_000, maxRooms: 5 },
    () => now,
  )
  server = createServer()
  close = attachWebSocket(server, {
    players: new Players(
      new SessionStore({ bufferTicks: 3, maxAheadTicks: 60, maxSessions: 10, ttlMs: 60_000 }),
      rooms,
    ),
    allowedOrigin: ORIGIN,
    trustProxy: false,
    maxConnectionsPerIp: 0,
    messagesPerSecond: 100,
    messageBurst: 100,
    heartbeatMs: 60_000,
    authenticate: (req) => Promise.resolve(USERS[req.headers.cookie ?? ''] ?? null),
  })
  server.listen(0)
  await once(server, 'listening')
})

afterEach(() => {
  close()
  server.close()
})

const hello = async (cookie?: string, resume?: { sessionId: string; token: string }) => {
  const url = `ws://127.0.0.1:${(server.address() as AddressInfo).port}/ws`
  const client = await connectClient(url, { origin: ORIGIN, ...(cookie ? { cookie } : {}) })
  client.send({ type: 'hello', protocol: PROTOCOL_VERSION, ...(resume ? { resume } : {}) })
  const welcome = await client.next('welcome')
  return { client, welcome }
}

/** Ala zakłada pokój, Bob dołącza, obaj gotowi, odliczanie mija. */
const startMatch = async (): Promise<{ ala: TestClient; bob: TestClient; code: string }> => {
  const { client: ala } = await hello('sid=ala')
  ala.send({ type: 'createRoom', visibility: 'private' })
  const { code } = await ala.next('room')
  const { client: bob } = await hello('sid=bob')
  bob.send({ type: 'joinRoom', code: code.toLowerCase() })
  await bob.next('room')
  ala.send({ type: 'ready' })
  bob.send({ type: 'ready' })
  await ala.next('room')
  await ala.next('room')
  expect((await ala.next('room')).state).toBe('countdown')
  now += COUNTDOWN_MS
  rooms.advance(1)
  return { ala, bob, code }
}

describe('rooms over WebSocket (spec versus-1v1)', () => {
  it('rejects a private room for a guest and lists a public one for watchers (spec versus-1v1, S1, S2)', async () => {
    const { client: guest } = await hello()
    guest.send({ type: 'createRoom', visibility: 'private' })
    expect(await guest.next('error')).toEqual({ type: 'error', code: 'login_required' })

    const { client: watcher } = await hello()
    watcher.send({ type: 'watchRooms' })
    expect((await watcher.next('rooms')).rooms).toEqual([])
    guest.send({ type: 'createRoom', visibility: 'public' })
    const room = await guest.next('room')
    expect((await watcher.next('rooms')).rooms).toEqual([
      { code: room.code, host: room.players[0]!.name, createdAt: now },
    ])
    expect(room.players[0]!.name).toMatch(/^Gość-\d{4}$/)

    watcher.send({ type: 'joinRoom', code: 'ZZZZZZ' })
    expect(await watcher.next('error')).toEqual({ type: 'error', code: 'room_not_found' })
  })

  it('plays a match: same start, no pause, leaving loses (spec versus-1v1, S2, S4)', async () => {
    const { ala, bob } = await startMatch()
    const [matchA, matchB] = await Promise.all([ala.next('match'), bob.next('match')])
    expect(matchA.state).toEqual(matchB.state)

    ala.send({ type: 'pause', tick: 0 })
    expect(await ala.next('error')).toEqual({ type: 'error', code: 'invalid' })
    ala.send({ type: 'newGame' })
    expect(await ala.next('error')).toEqual({ type: 'error', code: 'invalid' })

    ala.send({ type: 'input', seq: 1, tick: 0, actions: ['left'] })
    await new Promise((resolve) => setTimeout(resolve, 50))
    rooms.advance(12)
    expect((await ala.next('matchSnapshot')).ackSeq).toBe(1)

    bob.send({ type: 'leaveRoom' })
    expect(await ala.next('result')).toEqual({
      type: 'result',
      won: true,
      winner: 'ala',
      reason: 'left',
    })
    expect(await bob.next('roomClosed')).toEqual({ type: 'roomClosed' })
    // Ponowne wyjście (wyścig z zamknięciem pokoju) nie jest błędem protokołu.
    bob.send({ type: 'leaveRoom' })
    bob.send({ type: 'watchRooms' })
    await bob.next('rooms')
    expect(bob.messages.some((m) => m.type === 'error')).toBe(false)
  })

  it('returns a reconnecting player to the running match (spec versus-1v1, S4)', async () => {
    const { client: ala, welcome } = await hello('sid=ala')
    ala.send({ type: 'createRoom', visibility: 'public' })
    const { code } = await ala.next('room')
    const { client: bob } = await hello('sid=bob')
    bob.send({ type: 'joinRoom', code })
    ala.send({ type: 'ready' })
    bob.send({ type: 'ready' })
    await new Promise((resolve) => setTimeout(resolve, 50))
    now += COUNTDOWN_MS
    rooms.advance(1)
    await ala.next('match')

    ala.ws.close()
    await once(ala.ws, 'close')
    await new Promise((resolve) => setTimeout(resolve, 50))
    rooms.advance(60)

    const { client: again } = await hello('sid=ala', welcome)
    const match = await again.next('match')
    expect(match.tick).toBeGreaterThan(50)
    expect((await again.next('room')).players.every((p) => p.connected)).toBe(true)
  })
})

describe('deploy drain over WebSocket (spec infrastruktura, S4)', () => {
  it('keeps players in a match, sends others to the new pod and refuses new connections', async () => {
    const { ala, bob } = await startMatch()
    await ala.next('match')
    const { client: idle } = await hello()

    close.drain()
    const [code] = (await once(idle.ws, 'close')) as [number]
    expect(code).toBe(1012)
    expect(ala.ws.readyState).toBe(ala.ws.OPEN)

    const url = `ws://127.0.0.1:${(server.address() as AddressInfo).port}/ws`
    const rejected = new WebSocket(url, { headers: { origin: ORIGIN } })
    const [, res] = (await once(rejected, 'unexpected-response')) as [
      unknown,
      { statusCode: number },
    ]
    expect(res.statusCode).toBe(503)

    bob.send({ type: 'leaveRoom' })
    await ala.next('result')
    rooms.drain()
    rooms.advance(1)
    close.drain()
    const [after] = (await once(ala.ws, 'close')) as [number]
    expect(after).toBe(1012)
  })
})
