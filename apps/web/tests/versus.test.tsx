import { COUNTDOWN_MS, type ClientMessage, type ServerMessage } from '@tetris/protocol'
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
// Pokoje w pamięci: prawdziwy `RoomStore` z `apps/server`, bez sieci.
import type { RoomMember } from '../../server/src/rooms/room'
import { RoomStore, guestName } from '../../server/src/rooms/room-store'
import { App } from '../src/app/App/App'
import type { ConnectionHandlers } from '../src/core/net/connection'
import type { ConnectFn } from '../src/core/net/game-server'
import { GUEST, fakeApi } from './support/fake-api'

const PLAYER = { id: 2, username: 'pawn', role: null }
const ADMIN = { id: 1, username: 'boss', role: 'admin' }
const CODES = ['ABCDEF', 'GHJKLM', 'NPQRST']

/** Serwer pokoi w pamięci; `sent` zbiera wiadomości klienta, `bob` to drugi gracz. */
const roomServer = (user: { id: number; username: string } | null) => {
  let now = Date.now()
  let codes = 0
  const store = new RoomStore(
    { bufferTicks: 0, maxAheadTicks: 60, ttlMs: 60_000, maxRooms: 5 },
    () => now,
    () => CODES[codes++ % CODES.length]!,
  )
  const sent: ClientMessage[] = []
  let handlers: ConnectionHandlers | null = null
  const deliver = (msg: ServerMessage) => handlers?.onMessage(msg)
  const me: RoomMember = {
    sessionId: 'me',
    userId: user?.id ?? null,
    name: user?.username ?? guestName('me'),
  }
  const bobMessages: ServerMessage[] = []
  const bob: RoomMember = { sessionId: 'bob', userId: 99, name: 'bob' }

  const connect: ConnectFn = (h) => {
    handlers = h
    h.onStatus('online')
    h.onMessage({ type: 'welcome', sessionId: 's'.repeat(22), token: 't'.repeat(22) })
    return {
      send(msg) {
        sent.push(msg)
        switch (msg.type) {
          case 'watchRooms':
            store.watch(deliver)
            break
          case 'unwatchRooms':
            store.unwatch(deliver)
            break
          case 'createRoom':
          case 'joinRoom': {
            const error =
              msg.type === 'createRoom'
                ? store.create(me, msg.visibility, deliver)
                : store.join(me, msg.code, deliver)
            if (error) {
              deliver({ type: 'error', code: error })
            }
            break
          }
          case 'leaveRoom':
            store.leave('me')
            break
          case 'ready':
            store.ready('me')
            break
          case 'input':
            store.input('me', msg.seq, msg.tick, msg.actions)
            break
        }
        return true
      },
      stop() {
        handlers = null
      },
    }
  }

  return {
    connect,
    sent,
    store,
    bob: {
      create: () => act(() => void store.create(bob, 'public', (m) => bobMessages.push(m))),
      join: (code: string) => act(() => void store.join(bob, code, (m) => bobMessages.push(m))),
      ready: () => act(() => void store.ready('bob')),
      leave: () => act(() => void store.leave('bob')),
    },
    finishCountdown() {
      act(() => {
        now += COUNTDOWN_MS
        store.advance(1)
      })
    },
  }
}

/** Przejście jak wstecz/dalej w przeglądarce: router czyta adres przy `popstate`. */
const navigate = async (path: string) => {
  await act(async () => {
    window.history.pushState(null, '', path)
    window.dispatchEvent(new PopStateEvent('popstate'))
    await Promise.resolve()
  })
}

beforeEach(() => {
  vi.stubGlobal('requestAnimationFrame', vi.fn())
  vi.stubGlobal('cancelAnimationFrame', vi.fn())
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null)
  window.history.replaceState(null, '', '/')
})

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe('1v1 rooms (spec versus-1v1)', () => {
  it('lets a guest create a public room, start a match and win by walkover (spec versus-1v1, S1, S2, S4)', async () => {
    fakeApi(GUEST)
    const server = roomServer(null)
    render(<App connect={server.connect} />)
    await navigate('/1v1')

    expect(await screen.findByText('Brak otwartych pokoi. Załóż własny.')).toBeDefined()
    expect(
      screen.getByRole<HTMLButtonElement>('button', { name: 'Załóż pokój prywatny' }).disabled,
    ).toBe(true)

    fireEvent.click(screen.getByRole('button', { name: 'Załóż pokój publiczny' }))
    expect(screen.getByTestId('room-code').textContent).toBe('ABCDEF')
    const players = screen.getByRole('list', { name: 'Gracze' })
    expect(within(players).getByText(/\(Ty\)/).textContent).toMatch(/^Gość-\d{4} \(Ty\)/)
    expect(screen.getByText('Czekamy na drugiego gracza')).toBeDefined()

    server.bob.join('ABCDEF')
    fireEvent.click(screen.getByRole('button', { name: 'Gotowe' }))
    expect(screen.getByText('Czekamy na gotowość przeciwnika')).toBeDefined()
    server.bob.ready()
    expect(screen.getByTestId('countdown').textContent).toBe('3')

    server.finishCountdown()
    expect(screen.getByRole('img', { name: 'Twoja plansza' })).toBeDefined()
    expect(screen.getByRole('img', { name: 'Plansza przeciwnika' })).toBeDefined()
    expect(screen.getByText('bob', { selector: 'figcaption' })).toBeDefined()

    server.bob.leave()
    expect(screen.getByText('Wygrana!')).toBeDefined()
    expect(screen.getByText('Przeciwnik wyszedł z meczu')).toBeDefined()
    expect(screen.queryByRole('button', { name: 'Rewanż' })).toBeNull()

    fireEvent.click(screen.getByRole('button', { name: 'Wyjdź z pokoju' }))
    expect(await screen.findByText('Gra 1v1')).toBeDefined()
    expect(screen.queryByRole('img', { name: 'Twoja plansza' })).toBeNull()
  })

  it('joins a room from the public list and shows room errors (spec versus-1v1, S2)', async () => {
    fakeApi(GUEST)
    const server = roomServer(null)
    render(<App connect={server.connect} />)
    await navigate('/1v1')
    server.bob.create()

    const row = (await screen.findByText('bob')).closest('tr')!
    expect(within(row).getByText('przed chwilą')).toBeDefined()

    const codeInput = screen.getByLabelText('Kod pokoju')
    fireEvent.change(codeInput, { target: { value: 'zzzzzz' } })
    fireEvent.click(within(codeInput.closest('form')!).getByRole('button', { name: 'Dołącz' }))
    expect(screen.getByRole('alert').textContent).toBe(
      'Nie ma takiego pokoju albo został zamknięty',
    )
    expect(server.sent).toContainEqual({ type: 'joinRoom', code: 'ZZZZZZ' })

    fireEvent.click(within(row).getByRole('button', { name: 'Dołącz' }))
    expect(screen.getByTestId('room-code').textContent).toBe('ABCDEF')
    expect(screen.queryByRole('alert')).toBeNull()
  })

  it('creates a private room with a link and joins from a room link when logged in (spec versus-1v1, S1, S2)', async () => {
    fakeApi({ 'GET /me': () => [200, { user: PLAYER }] })
    const server = roomServer(PLAYER)
    server.bob.create()
    render(<App connect={server.connect} />)
    await navigate('/pokoj/abcdef')

    expect(await screen.findByTestId('room-code')).toBeDefined()
    expect(server.sent).toContainEqual({ type: 'joinRoom', code: 'ABCDEF' })
    expect(window.location.pathname).toBe('/1v1')
    expect(
      within(screen.getByRole('list', { name: 'Gracze' })).getByText(/pawn \(Ty\)/),
    ).toBeDefined()

    fireEvent.click(screen.getByRole('button', { name: 'Wyjdź' }))
    fireEvent.click(await screen.findByRole('button', { name: 'Załóż pokój prywatny' }))
    expect(screen.getByText(/Link dla przeciwnika/).textContent).toContain('/pokoj/GHJKLM')
  })
})

describe('match history and admin (spec ranking-historia R4, panel-admina R4–R5)', () => {
  it("shows the player's 1v1 matches in the account view", async () => {
    fakeApi({
      'GET /me': () => [200, { user: PLAYER }],
      'GET /me/games': () => [200, { games: [] }],
      'GET /me/matches': () => [
        200,
        {
          matches: [
            {
              id: 1,
              won: true,
              opponent: 'Gość-0042',
              reason: 'topout',
              linesSent: 8,
              linesReceived: 2,
              ticks: 5400,
              endedAt: '2026-11-14T10:00:00Z',
            },
          ],
        },
      ],
    })
    render(<App connect={roomServer(PLAYER).connect} />)
    await navigate('/konto')

    const row = (await screen.findByText('Gość-0042')).closest('tr')!
    expect(within(row).getByText('Wygrana')).toBeDefined()
    expect(within(row).getByText('1:30')).toBeDefined()
  })

  it('shows rooms, running matches and finished matches to the admin', async () => {
    const calls = fakeApi({
      'GET /me': () => [200, { user: ADMIN }],
      'GET /admin/users?q=': () => [200, { users: [] }],
      'GET /admin/rooms': () => [
        200,
        {
          rooms: [
            {
              code: 'ABCDEF',
              visibility: 'private',
              state: 'playing',
              host: 'boss',
              createdAt: Date.parse('2026-11-14T10:00:00Z'),
              players: [
                { name: 'boss', userId: 1, connected: true },
                { name: 'Gość-0007', userId: null, connected: false },
              ],
              match: {
                seconds: 75,
                players: [
                  { name: 'boss', score: 100, lines: 4, linesSent: 4 },
                  { name: 'Gość-0007', score: 0, lines: 0, linesSent: 0 },
                ],
              },
            },
          ],
        },
      ],
      'GET /admin/matches?q=': () => [
        200,
        {
          matches: [
            {
              id: 3,
              winnerName: 'pawn',
              loserName: 'Gość-0001',
              reason: 'left',
              winnerLinesSent: 2,
              loserLinesSent: 0,
              ticks: 600,
              endedAt: '2026-11-14T10:00:00Z',
            },
          ],
        },
      ],
      'GET /admin/matches?q=pawn': () => [200, { matches: [] }],
    })
    render(<App connect={roomServer(ADMIN).connect} />)
    await navigate('/admin')

    fireEvent.click(await screen.findByRole('tab', { name: 'Pokoje' }))
    const running = await screen.findByRole('table', { name: 'Trwające mecze' })
    expect(within(running).getByText('boss vs Gość-0007')).toBeDefined()
    expect(within(running).getByText('1:15')).toBeDefined()
    const rooms = screen.getByRole('table', { name: 'Pokoje' })
    expect(within(rooms).getByText('ABCDEF')).toBeDefined()
    expect(within(rooms).getByText('boss, Gość-0007 (rozłączony)')).toBeDefined()

    fireEvent.click(screen.getByRole('tab', { name: 'Mecze 1v1' }))
    const results = await screen.findByRole('table', { name: 'Wyniki meczów' })
    expect(within(results).getByText('wyjście z meczu')).toBeDefined()
    fireEvent.change(screen.getByLabelText('Gracz'), { target: { value: 'pawn' } })
    fireEvent.click(screen.getByRole('button', { name: 'Szukaj' }))
    expect(await screen.findByText('Brak meczów.')).toBeDefined()
    expect(calls.map((c) => c.key)).toContain('GET /admin/matches?q=pawn')
  })
})
