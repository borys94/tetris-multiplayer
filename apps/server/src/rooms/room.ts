import type { Action } from '@tetris/game-core'
import {
  COUNTDOWN_MS,
  type MatchEndReason,
  type RoomPlayer,
  type RoomState,
  type RoomVisibility,
} from '@tetris/protocol'
import type { BufferedClockOptions } from '../game/buffered-clock'
import type { Send } from '../game/send'
import { matchesFinished } from '../observability/metrics'
import { Match } from './match'

/** Gracz w pokoju: jego sesja gry (do wznowienia), konto i nazwa. */
export interface RoomMember {
  sessionId: string
  /** `null` to gość. */
  userId: number | null
  name: string
}

interface Player extends RoomMember {
  send: Send | null
  ready: boolean
  /** Kiedy gracz stracił połączenie (ms); `null`, gdy jest połączony. */
  disconnectedAt: number | null
}

export interface MatchResult {
  winner: RoomMember
  loser: RoomMember
  /** Dlaczego przegrany przegrał. */
  reason: MatchEndReason
  winnerLinesSent: number
  loserLinesSent: number
  ticks: number
}

export interface RoomOptions extends BufferedClockOptions {
  /** Jak długo rozłączony gracz może wrócić (ms); potem opuszcza pokój, a w meczu przegrywa. */
  ttlMs: number
}

/** Stan pokoju dla panelu admina (spec panel-admina, R4). */
export interface RoomInfo {
  code: string
  visibility: RoomVisibility
  state: RoomState
  host: string
  createdAt: number
  players: { name: string; userId: number | null; connected: boolean }[]
  match: {
    seconds: number
    players: { name: string; score: number; lines: number; linesSent: number }[]
  } | null
}

/** Liczba graczy w pokoju 1v1; w M8 stanie się parametrem pokoju. */
export const ROOM_CAPACITY = 2

/**
 * Pokój meczu 1v1 (spec versus-1v1, ADR-0010): członkostwo, gotowość, odliczanie, połączenia
 * graczy i wynik. Samą rozgrywkę liczy `Match`.
 * Założyciel jest zawsze pierwszy na liście; jego wyjście zamyka pokój.
 */
export class Room {
  private _state: RoomState = 'waiting'
  private readonly players: Player[] = []
  private startsAt: number | null = null
  /** Trwający lub ostatni mecz. */
  private match: Match<Player> | null = null
  private closed = false

  /** Koniec meczu (np. zapis wyniku). */
  onMatchEnd: ((result: MatchResult) => void) | null = null
  /** Gracz opuścił pokój (sam, po wygaśnięciu lub przez zamknięcie pokoju). */
  onLeave: ((sessionId: string) => void) | null = null
  /** Zmiana widoczna na liście pokoi publicznych albo zamknięcie pokoju. */
  onChange: (() => void) | null = null

  constructor(
    readonly code: string,
    readonly visibility: RoomVisibility,
    readonly createdAt: number,
    private readonly options: RoomOptions,
    private readonly now: () => number,
  ) {}

  get state(): RoomState {
    return this._state
  }

  get isClosed(): boolean {
    return this.closed
  }

  get size(): number {
    return this.players.length
  }

  get host(): RoomMember | undefined {
    return this.players[0]
  }

  /** Czy ktoś może dołączyć (pokój czeka i ma wolne miejsce). */
  get open(): boolean {
    return !this.closed && this._state === 'waiting' && this.players.length < ROOM_CAPACITY
  }

  has(sessionId: string): boolean {
    return this.players.some((p) => p.sessionId === sessionId)
  }

  hasUser(userId: number): boolean {
    return this.players.some((p) => p.userId === userId)
  }

  join(member: RoomMember, send: Send): void {
    this.players.push({
      ...member,
      send,
      ready: false,
      disconnectedAt: null,
    })
    this.broadcastRoom()
    this.onChange?.()
  }

  /** Gracz wychodzi: w meczu przegrywa walkowerem, a wyjście założyciela zamyka pokój. */
  leave(sessionId: string, reason: MatchEndReason = 'left'): void {
    const player = this.find(sessionId)
    if (!player) {
      return
    }
    if (this._state === 'playing') {
      this.finish(this.opponentOf(player)!, player, reason)
    }

    if (player === this.players[0]) {
      this.close()
      return
    }
    this.players.splice(this.players.indexOf(player), 1)
    this.onLeave?.(player.sessionId)
    player.send?.({ type: 'roomClosed' })
    this.backToWaiting()
    this.broadcastRoom()
    this.onChange?.()
  }

  /** Zamyka pokój i wyprasza wszystkich graczy. */
  close(): void {
    if (this.closed) {
      return
    }
    this.closed = true
    for (const player of this.players) {
      this.onLeave?.(player.sessionId)
      player.send?.({ type: 'roomClosed' })
    }
    this.players.length = 0
    this.onChange?.()
  }

  /** Gotowość do meczu lub rewanżu; `false`, gdy w tym stanie pokoju nie ma sensu (protokół). */
  ready(sessionId: string): boolean {
    const player = this.find(sessionId)
    if (!player) {
      return false
    }
    // Powtórzone „Gotowe” (zanim klient zobaczył odliczanie) nie łamie protokołu.
    if (player.ready || this._state === 'countdown') {
      return true
    }
    if (this._state !== 'waiting' && this._state !== 'finished') {
      return false
    }
    player.ready = true
    if (this.players.length === ROOM_CAPACITY && this.players.every((p) => p.ready)) {
      this._state = 'countdown'
      this.startsAt = this.now() + COUNTDOWN_MS
    }
    this.broadcastRoom()
    this.onChange?.()
    return true
  }

  input(sessionId: string, seq: number, clientTick: number, actions: readonly Action[]): boolean {
    const player = this.find(sessionId)
    // Akcje spóźnione po końcu meczu ignorujemy; przed startem to błąd protokołu.
    if (this._state === 'finished') {
      return true
    }
    if (this._state !== 'playing' || !player || !this.match) {
      return false
    }
    return this.match.input(player, seq, clientTick, actions)
  }

  /** Nowe połączenie gracza: dostaje stan pokoju, a w trakcie meczu cały stan gry. */
  attach(sessionId: string, send: Send): void {
    const player = this.find(sessionId)
    if (!player) {
      return
    }
    player.send = send
    player.disconnectedAt = null
    this.broadcastRoom()
    if (this._state === 'playing') {
      this.match?.reattach(player)
    }
  }

  /** Rozłączenie nie pauzuje meczu: plansza gracza dalej opada (spec versus-1v1, R4). */
  detach(sessionId: string): void {
    const player = this.find(sessionId)
    if (!player) {
      return
    }
    player.send = null
    player.disconnectedAt = this.now()
    this.broadcastRoom()
  }

  /** Przesuwa pokój o `ticks` ticków: wygasanie rozłączonych, start po odliczaniu, mecz. */
  advance(ticks: number): void {
    const now = this.now()
    for (const player of [...this.players]) {
      if (player.disconnectedAt !== null && now - player.disconnectedAt >= this.options.ttlMs) {
        this.leave(player.sessionId, 'timeout')
      }
    }
    if (this.closed) {
      return
    }

    if (this._state === 'countdown' && this.startsAt !== null && now >= this.startsAt) {
      this.startMatch()
    }
    if (this._state === 'playing') {
      this.match?.advance(ticks)
    }
  }

  info(): RoomInfo {
    const match = this._state === 'playing' ? this.match : null
    return {
      code: this.code,
      visibility: this.visibility,
      state: this._state,
      host: this.players[0]?.name ?? '',
      createdAt: this.createdAt,
      players: this.players.map((p) => ({
        name: p.name,
        userId: p.userId,
        connected: p.send !== null,
      })),
      match: match
        ? {
            seconds: match.seconds,
            players: this.players.map((p) => ({ name: p.name, ...match.stats(p) })),
          }
        : null,
    }
  }

  private startMatch(): void {
    this._state = 'playing'
    this.startsAt = null
    for (const player of this.players) {
      player.ready = false
    }
    const match = new Match([...this.players], this.options)
    match.onTopout = (loser) => this.finish(this.opponentOf(loser)!, loser, 'topout')
    this.match = match
    this.broadcastRoom()
    match.sendStates()
    this.onChange?.()
  }

  private finish(winner: Player, loser: Player, reason: MatchEndReason): void {
    this._state = 'finished'
    matchesFinished.inc({ reason })
    this.match?.end()
    for (const player of this.players) {
      player.send?.({ type: 'result', won: player === winner, winner: winner.name, reason })
    }
    this.onMatchEnd?.({
      winner: { sessionId: winner.sessionId, userId: winner.userId, name: winner.name },
      loser: { sessionId: loser.sessionId, userId: loser.userId, name: loser.name },
      reason,
      winnerLinesSent: this.match?.stats(winner).linesSent ?? 0,
      loserLinesSent: this.match?.stats(loser).linesSent ?? 0,
      ticks: this.match?.ticks ?? 0,
    })
    this.broadcastRoom()
    this.onChange?.()
  }

  /** Po wyjściu przeciwnika pokój znów czeka na drugiego gracza. */
  private backToWaiting(): void {
    if (this._state === 'playing') {
      return
    }
    this._state = 'waiting'
    this.startsAt = null
    for (const player of this.players) {
      player.ready = false
    }
  }

  private broadcastRoom(): void {
    const players: RoomPlayer[] = this.players.map((p, index) => ({
      name: p.name,
      host: index === 0,
      ready: p.ready,
      connected: p.send !== null,
    }))
    for (const [you, player] of this.players.entries()) {
      player.send?.({
        type: 'room',
        code: this.code,
        visibility: this.visibility,
        state: this._state,
        players,
        you,
        ...(this.startsAt !== null ? { startsAt: this.startsAt } : {}),
      })
    }
  }

  private find(sessionId: string): Player | undefined {
    return this.players.find((p) => p.sessionId === sessionId)
  }

  private opponentOf(player: Player): Player | undefined {
    return this.players.find((p) => p !== player)
  }
}
