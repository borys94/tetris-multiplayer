import { COUNTDOWN_MS, type ServerMessage } from '@tetris/protocol'
import { describe, expect, it, vi } from 'vitest'
import type { BufferedGame } from '../../src/game/buffered-game'
import { metricValue } from '../support/metrics'
import { garbageLines, matchesFinished } from '../../src/observability/metrics'
import type { MatchResult, RoomMember } from '../../src/rooms/room'
import { RoomStore, guestName } from '../../src/rooms/room-store'

const BUFFER = 3
const TTL = 10_000

const setup = (maxRooms = 3) => {
  let now = 1_000_000
  let codes = 0
  const results: MatchResult[] = []
  const store = new RoomStore(
    {
      bufferTicks: BUFFER,
      maxAheadTicks: 60,
      ttlMs: TTL,
      maxRooms,
      onMatchEnd: (result) => results.push(result),
    },
    () => now,
    () => `QWERT${++codes + 1}`,
  )
  return {
    store,
    results,
    advanceTime: (ms: number) => (now += ms),
    get now() {
      return now
    },
  }
}

interface TestPlayer extends RoomMember {
  messages: ServerMessage[]
  send: (msg: ServerMessage) => void
  last<T extends ServerMessage['type']>(type: T): Extract<ServerMessage, { type: T }> | undefined
}

let sessions = 0
const player = (userId: number | null = null, name?: string): TestPlayer => {
  const sessionId = `session-${++sessions}`
  const messages: ServerMessage[] = []
  return {
    sessionId,
    userId,
    name: name ?? guestName(sessionId),
    messages,
    send: (msg) => messages.push(msg),
    last: (type) => messages.filter((m) => m.type === type).at(-1) as never,
  }
}

/** Dwóch graczy w pokoju po odliczaniu, z trwającym meczem. */
const startedMatch = () => {
  const ctx = setup()
  const a = player(1, 'ala')
  const b = player(2, 'bob')
  ctx.store.create(a, 'public', a.send)
  ctx.store.join(b, 'QWERT2', b.send)
  ctx.store.ready(a.sessionId)
  ctx.store.ready(b.sessionId)
  ctx.advanceTime(COUNTDOWN_MS)
  ctx.store.advance(1)
  return { ...ctx, a, b, room: ctx.store.roomOf(a.sessionId)! }
}

const gameOf = (ctx: ReturnType<typeof startedMatch>, index: number): BufferedGame => {
  const room = ctx.room as unknown as { match: { contenders: { game: BufferedGame }[] } }
  return room.match.contenders[index]!.game
}

describe('creating rooms (spec versus-1v1, S1)', () => {
  it('lets a guest create only a public room, and only one', () => {
    const { store } = setup()
    const guest = player()

    expect(store.create(guest, 'private', guest.send)).toBe('login_required')
    expect(store.create(guest, 'public', guest.send)).toBeNull()
    expect(guest.last('room')).toMatchObject({
      code: 'QWERT2',
      visibility: 'public',
      state: 'waiting',
      players: [{ name: guest.name, host: true, ready: false, connected: true }],
    })
    expect(store.create(guest, 'public', guest.send)).toBe('room_limit')
    expect(store.size).toBe(1)
  })

  it('limits a logged-in user to one open room across sessions (tabs)', () => {
    const { store } = setup()
    const tab1 = player(7)
    const tab2 = { ...player(7), userId: 7 }

    expect(store.create(tab1, 'private', tab1.send)).toBeNull()
    expect(store.create(tab2, 'public', tab2.send)).toBe('room_limit')
  })

  it('refuses new rooms over the limit and frees the owner slot when the room closes', () => {
    const { store } = setup(1)
    const a = player(1)
    const b = player(2)
    store.create(a, 'public', a.send)

    expect(store.create(b, 'public', b.send)).toBe('server_full')
    store.leave(a.sessionId)
    expect(a.last('roomClosed')).toBeDefined()
    expect(store.size).toBe(0)
    expect(store.create(a, 'public', a.send)).toBeNull()
  })
})

describe('joining rooms (spec versus-1v1, S2)', () => {
  it('shows open public rooms to watchers and hides full and private ones', () => {
    const { store, now } = setup()
    const watcher = player()
    store.watch(watcher.send)
    const host = player(1, 'ala')
    store.create(host, 'public', host.send)
    store.create(player(2), 'private', vi.fn())

    expect(watcher.last('rooms')?.rooms).toEqual([{ code: 'QWERT2', host: 'ala', createdAt: now }])
    store.join(player(), 'QWERT2', vi.fn())
    expect(watcher.last('rooms')?.rooms).toEqual([])
  })

  it('joins by code, case already normalized, and rejects bad codes and full rooms', () => {
    const { store } = setup()
    const a = player(1, 'ala')
    const b = player(null)
    const c = player(null)
    store.create(a, 'private', a.send)

    expect(store.join(b, 'ZZZZZZ', b.send)).toBe('room_not_found')
    expect(store.join(b, 'QWERT2', b.send)).toBeNull()
    expect(a.last('room')?.players.map((p) => p.name)).toEqual(['ala', b.name])
    expect(a.last('room')?.you).toBe(0)
    expect(b.last('room')?.you).toBe(1)
    expect(store.join(c, 'QWERT2', c.send)).toBe('room_full')
    expect(store.join(b, 'QWERT2', b.send)).toBe('room_limit')
  })

  it('does not let the same user join their own room from another tab', () => {
    const { store } = setup()
    const tab1 = player(5)
    const tab2 = { ...player(5), userId: 5 }
    store.create(tab1, 'public', tab1.send)

    expect(store.join(tab2, 'QWERT2', tab2.send)).toBe('room_full')
  })

  it('counts down once both players are ready and starts both with the same game', () => {
    const ctx = setup()
    const a = player(1)
    const b = player(2)
    ctx.store.create(a, 'public', a.send)
    ctx.store.join(b, 'QWERT2', b.send)
    ctx.store.ready(a.sessionId)
    expect(a.last('room')?.state).toBe('waiting')

    ctx.store.ready(b.sessionId)
    expect(a.last('room')).toMatchObject({ state: 'countdown', startsAt: ctx.now + COUNTDOWN_MS })
    expect(ctx.store.ready(b.sessionId)).toBe(true)
    ctx.advanceTime(COUNTDOWN_MS - 1)
    ctx.store.advance(1)
    expect(a.last('match')).toBeUndefined()

    ctx.advanceTime(1)
    ctx.store.advance(1)
    const matchA = a.last('match')!
    const matchB = b.last('match')!
    expect(matchA.tick).toBe(0)
    expect(matchA.state).toEqual(matchB.state)
    expect(matchA.opponent.board).toEqual(matchB.state.board)
    expect(a.last('room')?.state).toBe('playing')
  })

  it('cancels the countdown when the guest leaves', () => {
    const ctx = setup()
    const a = player(1)
    const b = player(2)
    ctx.store.create(a, 'public', a.send)
    ctx.store.join(b, 'QWERT2', b.send)
    ctx.store.ready(a.sessionId)
    ctx.store.ready(b.sessionId)
    ctx.store.leave(b.sessionId)

    expect(a.last('room')).toMatchObject({ state: 'waiting', players: [{ ready: false }] })
    expect(a.last('room')?.startsAt).toBeUndefined()
  })
})

describe('match (spec versus-1v1, S3, S4)', () => {
  it('sends snapshots with the opponent board every 6 ticks', () => {
    const ctx = startedMatch()
    ctx.store.advance(BUFFER + 6)

    const snapshot = ctx.a.last('matchSnapshot')!
    expect(snapshot.tick).toBe(6)
    expect(snapshot.opponent.status).toBe('playing')
  })

  it('delivers cleared lines as garbage to the opponent on the same tick', () => {
    const ctx = startedMatch()
    const attacker = gameOf(ctx, 0)
    const rows = Array.from({ length: 22 }, (_, y) =>
      Array.from({ length: 10 }, (_, x) => (y >= 18 && x !== 9 ? ('Z' as const) : null)),
    )
    attacker.game = {
      ...attacker.game,
      board: rows,
      active: { type: 'I', rotation: 1, x: 7, y: 0 },
    }

    expect(ctx.store.input(ctx.a.sessionId, 1, 0, ['hardDrop'])).toBe(true)
    ctx.store.advance(BUFFER + 6)

    expect(ctx.a.last('matchSnapshot')?.state.linesSent).toBe(4)
    const garbage = ctx.b.last('matchSnapshot')!.state.garbage
    expect(garbage).toHaveLength(1)
    expect(garbage[0]?.lines).toBe(4)
    expect(ctx.a.last('matchSnapshot')?.opponent.garbage).toEqual(garbage)
  })

  it('ends the match when a player tops out, and allows a rematch', () => {
    const ctx = startedMatch()
    for (let seq = 1; ctx.results.length === 0 && seq < 200; seq++) {
      ctx.store.input(ctx.b.sessionId, seq, seq - 1, ['hardDrop'])
      ctx.store.advance(1)
    }

    expect(ctx.results).toEqual([
      expect.objectContaining({
        winner: expect.objectContaining({ name: 'ala', userId: 1 }) as unknown,
        loser: expect.objectContaining({ name: 'bob', userId: 2 }) as unknown,
        reason: 'topout',
      }),
    ])
    expect(ctx.a.last('result')).toEqual({
      type: 'result',
      won: true,
      winner: 'ala',
      reason: 'topout',
    })
    expect(ctx.b.last('result')).toMatchObject({ won: false, winner: 'ala' })
    expect(ctx.store.input(ctx.b.sessionId, 500, 500, ['left'])).toBe(true)

    ctx.store.ready(ctx.a.sessionId)
    ctx.store.ready(ctx.b.sessionId)
    expect(ctx.a.last('room')?.state).toBe('countdown')
  })

  it("keeps a disconnected player's game running and resumes it on reconnect", () => {
    const ctx = startedMatch()
    ctx.store.detach(ctx.a.sessionId)
    ctx.store.advance(120)
    expect(ctx.b.last('room')?.players[0]?.connected).toBe(false)

    const again = player(1, 'ala')
    ctx.store.attach(ctx.a.sessionId, again.send)
    const match = again.last('match')!
    expect(match.tick).toBeGreaterThan(100)
    expect(match.state.ticks).toBe(match.tick)
    expect(ctx.store.input(ctx.a.sessionId, 1, match.tick, ['left'])).toBe(true)
  })

  it('gives the win to the opponent when a player does not return within the TTL', () => {
    const ctx = startedMatch()
    ctx.store.detach(ctx.b.sessionId)
    ctx.advanceTime(TTL)
    ctx.store.advance(1)

    expect(ctx.results[0]).toMatchObject({ reason: 'timeout', winner: { name: 'ala' } })
    expect(ctx.a.last('room')).toMatchObject({ state: 'waiting', players: [{ name: 'ala' }] })
    expect(ctx.store.roomOf(ctx.b.sessionId)).toBeUndefined()
  })

  it('treats leaving as a loss and closes the room when the host leaves', () => {
    const ctx = startedMatch()
    ctx.store.leave(ctx.a.sessionId)

    expect(ctx.results[0]).toMatchObject({ reason: 'left', winner: { name: 'bob' } })
    expect(ctx.b.last('result')).toMatchObject({ won: true, reason: 'left' })
    expect(ctx.b.last('roomClosed')).toBeDefined()
    expect(ctx.store.roomOf(ctx.b.sessionId)).toBeUndefined()
    expect(ctx.store.size).toBe(0)
  })

  it('rejects inputs before the match and lists rooms for the admin', () => {
    const { store } = setup()
    const a = player(1, 'ala')
    store.create(a, 'private', a.send)

    expect(store.input(a.sessionId, 1, 0, ['left'])).toBe(false)
    expect(store.ready('unknown')).toBe(false)
    expect(store.list()).toEqual([
      expect.objectContaining({
        code: 'QWERT2',
        visibility: 'private',
        host: 'ala',
        state: 'waiting',
        match: null,
      }),
    ])
    expect(store.leave(a.sessionId)).toBe(true)
    expect(store.leave(a.sessionId)).toBe(false)
  })

  it('reports the running match to the admin', () => {
    const ctx = startedMatch()
    ctx.store.advance(BUFFER + 120)

    expect(ctx.store.list()[0]?.match).toEqual({
      seconds: 2,
      players: [expect.objectContaining({ name: 'ala' }), expect.objectContaining({ name: 'bob' })],
    })
  })
})

describe('guestName', () => {
  it('is stable for a session', () => {
    expect(guestName('abc')).toBe(guestName('abc'))
    expect(guestName('abc')).toMatch(/^Gość-\d{4}$/)
  })
})

describe('deploy drain (spec infrastruktura, S4)', () => {
  it('closes idle rooms, refuses new ones and closes a playing room right after its match', () => {
    const ctx = startedMatch()
    const idleHost = player(3, 'cid')
    ctx.store.create(idleHost, 'public', idleHost.send)
    const newcomer = player(4)

    ctx.store.drain()
    expect(idleHost.last('roomClosed')).toBeDefined()
    expect(ctx.store.playing).toBe(1)
    expect(ctx.store.create(newcomer, 'public', newcomer.send)).toBe('server_full')
    expect(ctx.store.join(newcomer, 'QWERT2', newcomer.send)).toBe('server_full')

    ctx.store.advance(30)
    expect(ctx.room.state).toBe('playing')
    ctx.store.leave(ctx.b.sessionId)
    ctx.store.advance(1)
    expect(ctx.a.last('roomClosed')).toBeDefined()
    expect(ctx.store.playing).toBe(0)
    expect(ctx.store.size).toBe(0)
  })

  it('counts rooms by state and visibility for the rooms metric', () => {
    const ctx = startedMatch()
    const other = player(5)
    ctx.store.create(other, 'private', other.send)

    const counts = ctx.store.countByState()
    expect(counts).toHaveLength(8)
    expect(counts).toContainEqual({ state: 'playing', visibility: 'public', count: 1 })
    expect(counts).toContainEqual({ state: 'waiting', visibility: 'private', count: 1 })
    expect(counts).toContainEqual({ state: 'waiting', visibility: 'public', count: 0 })
  })

  it('counts finished matches by reason and garbage lines sent', async () => {
    const before = await metricValue(matchesFinished, { reason: 'left' })
    const garbageBefore = await metricValue(garbageLines)
    const ctx = startedMatch()
    const attacker = gameOf(ctx, 0)
    attacker.game = {
      ...attacker.game,
      board: Array.from({ length: 22 }, (_, y) =>
        Array.from({ length: 10 }, (_, x) => (y >= 20 && x !== 9 ? ('Z' as const) : null)),
      ),
      active: { type: 'I', rotation: 1, x: 7, y: 0 },
    }
    ctx.store.input(ctx.a.sessionId, 1, 0, ['hardDrop'])
    ctx.store.advance(BUFFER + 2)
    ctx.store.leave(ctx.b.sessionId)

    expect(await metricValue(garbageLines)).toBe(garbageBefore + 1)
    expect(await metricValue(matchesFinished, { reason: 'left' })).toBe(before + 1)
  })
})
