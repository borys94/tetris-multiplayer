import type { RoomSummary, ServerMessage } from '@tetris/protocol'
import { ROOM_CODE } from '../../../core/routes'
import type { Send } from '../../../core/net/game-server'
import { ROOM_ERRORS } from '../../../core/net/labels'
import type { RoomMessage } from './messages'
import { Store } from '../../../core/store'

/** Lista pokoi z chwilą jej otrzymania (do pokazania, jak długo pokój czeka). */
export interface RoomList {
  rooms: RoomSummary[]
  receivedAt: number
}

export interface LobbyState {
  rooms: RoomList | null
  /** Pokój gracza; `null` poza pokojem. */
  room: RoomMessage | null
  error: string | null
}

/** Jak długo pokój czeka na drugiego gracza. */
export const waitingFor = (createdAt: number, now: number): string => {
  const minutes = Math.floor((now - createdAt) / 60_000)
  return minutes < 1 ? 'przed chwilą' : `${minutes} min`
}

/** Podpowiedź w poczekalni: na co czeka pokój i co gracz może zrobić. */
export const roomHint = (room: RoomMessage): string => {
  const me = room.players[room.you]
  const full = room.players.length === 2
  return room.state === 'playing'
    ? 'Mecz trwa'
    : room.state === 'countdown'
      ? 'Start za chwilę'
      : room.state === 'finished'
        ? 'Mecz zakończony'
        : !full
          ? 'Czekamy na drugiego gracza'
          : me?.ready
            ? 'Czekamy na gotowość przeciwnika'
            : 'Kliknij „Gotowe”, gdy chcesz zacząć'
}

/**
 * Pokoje 1v1 (spec versus-1v1): lista publicznych, pokój gracza i jego błędy, akcje pokoju.
 * Mecz w pokoju liczy `MatchSession`.
 */
export class Lobby extends Store<LobbyState> {
  constructor(
    private readonly send: Send,
    private readonly now: () => number = Date.now,
  ) {
    super({ rooms: null, room: null, error: null })
  }

  createRoom = (visibility: 'public' | 'private'): void => {
    this.send({ type: 'createRoom', visibility })
  }

  joinRoom = (code: string): void => {
    this.send({ type: 'joinRoom', code: code.trim().toUpperCase() })
  }

  ready = (): void => {
    this.send({ type: 'ready' })
  }

  leave = (): void => {
    this.send({ type: 'leaveRoom' })
  }

  /**
   * Lista pokoi płynie tylko, gdy gracz ją widzi (widok aktywny, połączenie, poza pokojem).
   * Zwraca wypisanie; po ponownym połączeniu trzeba subskrybować od nowa.
   */
  watchRooms(): () => void {
    this.send({ type: 'watchRooms' })
    return () => void this.send({ type: 'unwatchRooms' })
  }

  /** Link `/pokoj/<kod>`: dołącza do pokoju, jeśli kod jest poprawny, a gracz nie jest w pokoju. */
  followLink(code: string): void {
    if (ROOM_CODE.test(code) && !this.getState().room) {
      this.joinRoom(code)
    }
  }

  receive(msg: ServerMessage): void {
    switch (msg.type) {
      case 'rooms':
        this.setState({ rooms: { rooms: msg.rooms, receivedAt: this.now() } })
        break
      case 'room':
        this.setState({ room: msg, error: null })
        break
      case 'roomClosed':
        this.setState({ room: null })
        break
      case 'error':
        if (msg.code === 'session_expired') {
          this.setState({ room: null })
        } else if (ROOM_ERRORS[msg.code]) {
          this.setState({ error: ROOM_ERRORS[msg.code]! })
        }
        break
    }
  }
}
