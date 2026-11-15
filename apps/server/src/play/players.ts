import type { Action } from '@tetris/game-core'
import type { RoomVisibility } from '@tetris/protocol'
import { randomSeed } from '../game/random'
import type { Send } from '../game/send'
import type { Session } from '../game/session'
import type { SessionStore } from '../game/session-store'
import { gamesStarted, serverFull } from '../observability/metrics'
import type { RoomMember } from '../rooms/room'
import { guestName, type RoomError, type RoomStore } from '../rooms/room-store'

/** Konto gracza; `null` to gość. */
export type PlayerAccount = { id: number; username: string } | null

/** Połączenie gracza widziane przez warstwę aplikacji (WebSocket albo test). */
export interface PlayerClient {
  send: Send
  /** Sesję przejęło nowe połączenie (np. druga karta): to trzeba zamknąć. */
  replaced(): void
}

export type ConnectError = 'session_expired' | 'server_full'

/**
 * Gracze podłączeni do sesji gry i pokoi (spec solo, konta, versus-1v1): kto jest właścicielem
 * sesji, przejmowanie jej przez nowe połączenie, przejście do pokoju i rozłączenie.
 * Transport (WebSocket) tylko tłumaczy wiadomości na wywołania `Player`.
 */
export class Players {
  private readonly owners = new Map<string, Player>()

  constructor(
    readonly sessions: SessionStore,
    /** Pokoje 1v1 (spec versus-1v1); bez nich wiadomości pokoi są błędem protokołu. */
    readonly rooms?: RoomStore,
  ) {}

  /** Podpina połączenie do nowej albo wznowionej sesji gry. */
  connect(
    client: PlayerClient,
    account: PlayerAccount,
    resume?: { sessionId: string; token: string },
  ): Player | ConnectError {
    let session: Session | null
    if (resume) {
      session = this.sessions.find(resume.sessionId, resume.token)
      // Klient zaczyna wtedy od nowa wiadomością `hello` bez `resume`.
      if (!session) {
        return 'session_expired'
      }
      const previous = this.owners.get(session.id)
      if (previous) {
        previous.release()
        session.detach()
        previous.client.replaced()
      }
    } else {
      session = this.sessions.create()
      if (!session) {
        serverFull.inc()
        return 'server_full'
      }
      session.userId = account?.id ?? null
      gamesStarted.inc()
    }

    const player = new Player(this, session, client, account)
    this.owners.set(session.id, player)
    this.sessions.markAttached(session)
    client.send({ type: 'welcome', sessionId: session.id, token: session.token })
    session.attach(client.send)
    this.rooms?.attach(session.id, client.send)
    return player
  }

  /** Połączenie zamknięte: sesja czeka na wznowienie, w pokoju gracz jest rozłączony. */
  disconnect(player: Player): void {
    const session = player.session
    if (this.owners.get(session.id) !== player) {
      return
    }
    this.owners.delete(session.id)
    session.detach()
    this.sessions.markDetached(session)
    this.rooms?.detach(session.id)
  }
}

/**
 * Jeden podłączony gracz. Metody zwracają `false`, gdy wiadomość łamie protokół
 * w bieżącym stanie (np. pauza w pokoju albo akcja po przejęciu sesji).
 */
export class Player {
  private watching = false
  private released = false

  constructor(
    private readonly players: Players,
    readonly session: Session,
    readonly client: PlayerClient,
    private readonly account: PlayerAccount,
  ) {}

  /** Czy gracz jest w trakcie meczu (takiego połączenia nie zamykamy przy deployu). */
  get inMatch(): boolean {
    return !this.released && this.room?.state === 'playing'
  }

  private get room() {
    return this.players.rooms?.roomOf(this.session.id)
  }

  private get userId(): number | null {
    return this.account?.id ?? null
  }

  private get member(): RoomMember {
    return {
      sessionId: this.session.id,
      userId: this.userId,
      name: this.account?.username ?? guestName(this.session.id),
    }
  }

  /** Sesję przejęło inne połączenie: to nie steruje już grą. */
  release(): void {
    this.released = true
  }

  input(seq: number, tick: number, actions: readonly Action[]): boolean {
    if (this.released) {
      return false
    }
    const rooms = this.players.rooms
    return rooms && this.room
      ? rooms.input(this.session.id, seq, tick, actions)
      : this.session.input(seq, tick, actions)
  }

  watchRooms(): boolean {
    const rooms = this.players.rooms
    if (this.released || !rooms) {
      return false
    }
    this.watching = true
    rooms.watch(this.client.send)
    return true
  }

  unwatchRooms(): boolean {
    if (this.released) {
      return false
    }
    this.watching = false
    this.players.rooms?.unwatch(this.client.send)
    return true
  }

  createRoom(visibility: RoomVisibility): boolean {
    return this.enterRoom((rooms) => rooms.create(this.member, visibility, this.client.send))
  }

  joinRoom(code: string): boolean {
    return this.enterRoom((rooms) => rooms.join(this.member, code, this.client.send))
  }

  /** Wyjście z już zamkniętego pokoju (np. założyciel wyszedł chwilę wcześniej) to nie błąd. */
  leaveRoom(): boolean {
    const rooms = this.players.rooms
    if (this.released || !rooms) {
      return false
    }
    rooms.leave(this.session.id)
    return true
  }

  ready(): boolean {
    if (this.released) {
      return false
    }
    return this.players.rooms?.ready(this.session.id) ?? false
  }

  // W pokoju nie ma singleplayera ani pauzy (spec versus-1v1).

  newGame(): boolean {
    if (this.released || this.room) {
      return false
    }
    this.session.userId = this.userId
    this.session.newGame(randomSeed())
    gamesStarted.inc()
    return true
  }

  pause(tick: number): boolean {
    if (this.released || this.room) {
      return false
    }
    this.session.pause(tick)
    return true
  }

  resume(): boolean {
    if (this.released || this.room) {
      return false
    }
    this.session.resume()
    return true
  }

  /** Połączenie zamknięte. */
  disconnect(): void {
    if (this.watching) {
      this.players.rooms?.unwatch(this.client.send)
    }
    this.players.disconnect(this)
  }

  private enterRoom(enter: (rooms: RoomStore) => RoomError | null): boolean {
    const rooms = this.players.rooms
    if (this.released || !rooms) {
      return false
    }
    // Gra singleplayer czeka wstrzymana, aż gracz wróci z pokoju.
    this.session.suspend()
    const error = enter(rooms)
    if (error) {
      this.client.send({ type: 'error', code: error })
    }
    return true
  }
}
