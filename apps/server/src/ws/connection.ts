import {
  PROTOCOL_VERSION,
  parseClientMessage,
  type ClientMessage,
  type ErrorCode,
  type ServerMessage,
} from '@tetris/protocol'
import { WebSocket, type RawData } from 'ws'
import { wsErrors, wsMessages, wsSentBytes } from '../observability/metrics'
import type { Player, PlayerAccount, Players } from '../play/players'
import { RateLimiter } from './rate-limiter'

/** Tyle błędnych wiadomości z rzędu zamyka połączenie (spec siec-protokol, S2). */
const MAX_CONSECUTIVE_ERRORS = 3

export const CLOSE_POLICY = 1008
export const CLOSE_TRY_AGAIN = 1013
/** Sesję przejęło nowe połączenie (np. druga karta). */
export const CLOSE_REPLACED = 4000

export interface MessageLimits {
  /** Limit wiadomości: średnio na sekundę i maksymalny chwilowy zapas. */
  messagesPerSecond: number
  messageBurst: number
}

const rawToString = (data: RawData): string => {
  if (Array.isArray(data)) {
    return Buffer.concat(data).toString('utf8')
  }
  return Buffer.from(data as ArrayBuffer).toString('utf8')
}

/**
 * Jedno połączenie WebSocket: parsowanie i limity wiadomości, licznik błędów protokołu
 * i tłumaczenie wiadomości klienta na wywołania gracza (`play/players`).
 */
export class Connection {
  private player: Player | null = null
  private errors = 0
  private readonly limiter: RateLimiter
  alive = true

  constructor(
    readonly ws: WebSocket,
    /** Zalogowany gracz tego połączenia; `null` to gość. */
    private readonly account: PlayerAccount,
    private readonly players: Players,
    limits: MessageLimits,
  ) {
    this.limiter = new RateLimiter(limits.messagesPerSecond, limits.messageBurst)
  }

  send = (msg: ServerMessage): void => {
    if (this.ws.readyState !== WebSocket.OPEN) {
      return
    }
    const data = JSON.stringify(msg)
    wsSentBytes.inc({ type: msg.type }, data.length)
    this.ws.send(data)
  }

  /** Czy gracz jest w trakcie meczu (takiego połączenia nie zamykamy przy deployu). */
  get inMatch(): boolean {
    return this.player?.inMatch ?? false
  }

  receive(data: RawData, isBinary: boolean): void {
    wsMessages.inc()
    if (!this.limiter.take()) {
      return this.fail('rate_limited')
    }
    const msg = isBinary ? null : parseClientMessage(rawToString(data))
    if (!msg || !this.handle(msg)) {
      return this.fail('invalid')
    }
    this.errors = 0
  }

  close(): void {
    this.player?.disconnect()
  }

  /** Obsługuje poprawną składniowo wiadomość; `false` oznacza złamanie protokołu. */
  private handle(msg: ClientMessage): boolean {
    if (msg.type === 'hello') {
      return this.hello(msg)
    }
    const player = this.player
    if (!player) {
      return false
    }

    switch (msg.type) {
      case 'input':
        return player.input(msg.seq, msg.tick, msg.actions)
      case 'watchRooms':
        return player.watchRooms()
      case 'unwatchRooms':
        return player.unwatchRooms()
      case 'createRoom':
        return player.createRoom(msg.visibility)
      case 'joinRoom':
        return player.joinRoom(msg.code)
      case 'leaveRoom':
        return player.leaveRoom()
      case 'ready':
        return player.ready()
      case 'newGame':
        return player.newGame()
      case 'pause':
        return player.pause(msg.tick)
      case 'resume':
        return player.resume()
    }
  }

  private hello(msg: Extract<ClientMessage, { type: 'hello' }>): boolean {
    if (this.player) {
      return false
    }
    if (msg.protocol !== PROTOCOL_VERSION) {
      this.send({ type: 'error', code: 'version' })
      this.ws.close(CLOSE_POLICY, 'version')
      return true
    }

    const client = { send: this.send, replaced: () => this.ws.close(CLOSE_REPLACED, 'replaced') }
    const result = this.players.connect(client, this.account, msg.resume)
    if (result === 'session_expired') {
      this.send({ type: 'error', code: 'session_expired' })
    } else if (result === 'server_full') {
      this.send({ type: 'error', code: 'server_full' })
      this.ws.close(CLOSE_TRY_AGAIN, 'server full')
    } else {
      this.player = result
    }
    return true
  }

  private fail(code: ErrorCode): void {
    wsErrors.inc({ code })
    this.send({ type: 'error', code })
    if (++this.errors >= MAX_CONSECUTIVE_ERRORS) {
      this.ws.close(CLOSE_POLICY, code)
    }
  }
}
