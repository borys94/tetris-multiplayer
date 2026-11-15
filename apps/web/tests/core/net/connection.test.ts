import { PROTOCOL_VERSION, type ServerMessage } from '@tetris/protocol'
import { describe, expect, it } from 'vitest'
import {
  Connection,
  type ConnectionStatus,
  type SocketLike,
} from '../../../src/core/net/connection'

class FakeSocket implements SocketLike {
  readyState = 0
  sent: unknown[] = []
  onopen: (() => void) | null = null
  onmessage: ((event: { data: unknown }) => void) | null = null
  onclose: ((event: { code: number }) => void) | null = null

  send(data: string) {
    this.sent.push(JSON.parse(data))
  }
  close() {
    this.readyState = 3
  }
  open() {
    this.readyState = 1
    this.onopen?.()
  }
  receive(msg: ServerMessage) {
    this.onmessage?.({ data: JSON.stringify(msg) })
  }
  drop(code = 1006) {
    this.readyState = 3
    this.onclose?.({ code })
  }
}

const setup = () => {
  const sockets: FakeSocket[] = []
  const timers: { callback: () => void; ms: number }[] = []
  const statuses: ConnectionStatus[] = []
  const messages: ServerMessage[] = []
  const connection = new Connection(
    'ws://test/ws',
    { onMessage: (msg) => messages.push(msg), onStatus: (status) => statuses.push(status) },
    {
      createSocket: () => {
        const socket = new FakeSocket()
        sockets.push(socket)
        return socket
      },
      setTimeout: (callback, ms) => timers.push({ callback, ms }),
      clearTimeout: () => {},
      random: () => 0.5,
    },
  )
  connection.start()
  return { connection, sockets, timers, statuses, messages }
}

const WELCOME = { type: 'welcome', sessionId: 's'.repeat(22), token: 't'.repeat(22) } as const

describe('Connection', () => {
  it('says hello and goes online on welcome', () => {
    const { sockets, statuses, messages } = setup()
    sockets[0]!.open()
    sockets[0]!.receive(WELCOME)

    expect(sockets[0]!.sent).toEqual([{ type: 'hello', protocol: PROTOCOL_VERSION }])
    expect(statuses).toEqual(['connecting', 'online'])
    expect(messages).toEqual([WELCOME])
  })

  it('reconnects with growing delays and resumes the session (spec siec-protokol, S3)', () => {
    const { sockets, timers, statuses } = setup()
    sockets[0]!.open()
    sockets[0]!.receive(WELCOME)

    sockets[0]!.drop()
    timers[0]!.callback()
    sockets[1]!.drop()
    timers[1]!.callback()
    sockets[2]!.open()

    expect(timers.map((t) => t.ms)).toEqual([500, 1000])
    expect(statuses.slice(2)).toEqual(['offline', 'connecting', 'offline', 'connecting'])
    expect(sockets[2]!.sent).toEqual([
      {
        type: 'hello',
        protocol: PROTOCOL_VERSION,
        resume: { sessionId: WELCOME.sessionId, token: WELCOME.token },
      },
    ])
  })

  it('caps the backoff at 8 s and resets it after a successful welcome', () => {
    const { sockets, timers } = setup()
    for (let i = 0; i < 7; i++) {
      sockets[i]!.drop()
      timers[i]!.callback()
    }
    sockets[7]!.open()
    sockets[7]!.receive(WELCOME)
    sockets[7]!.drop()

    expect(timers.map((t) => t.ms)).toEqual([500, 1000, 2000, 4000, 8000, 8000, 8000, 500])
  })

  it('starts a fresh session when the old one expired (spec siec-protokol, S3)', () => {
    const { sockets, timers } = setup()
    sockets[0]!.open()
    sockets[0]!.receive(WELCOME)
    sockets[0]!.drop()
    timers[0]!.callback()
    sockets[1]!.open()
    sockets[1]!.receive({ type: 'error', code: 'session_expired' })

    expect(sockets[1]!.sent).toEqual([
      {
        type: 'hello',
        protocol: PROTOCOL_VERSION,
        resume: { sessionId: WELCOME.sessionId, token: WELCOME.token },
      },
      { type: 'hello', protocol: PROTOCOL_VERSION },
    ])
  })

  it('does not reconnect after being replaced by another tab or after stop()', () => {
    const { connection, sockets, timers, statuses } = setup()
    sockets[0]!.open()
    sockets[0]!.drop(4000)
    expect(statuses.at(-1)).toBe('closed')

    connection.start()
    connection.stop()
    sockets[1]!.drop()
    expect(timers).toHaveLength(0)
    expect(connection.send({ type: 'resume' })).toBe(false)
  })
})
