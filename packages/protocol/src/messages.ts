import type { Action, GameState } from '@tetris/game-core'

/** Wersja protokołu; klient wysyła ją w `hello`, przy niezgodności serwer odpowiada błędem `version`. */
export const PROTOCOL_VERSION = 2
/** Maksymalny rozmiar wiadomości od klienta w bajtach. */
export const MAX_MESSAGE_BYTES = 1024
/** Maksymalna liczba akcji w jednej wiadomości `input` (wszystkie z tego samego ticka). */
export const MAX_ACTIONS_PER_INPUT = 8
/** Co ile ticków symulacji serwer wysyła snapshot (10/s). */
export const SNAPSHOT_INTERVAL_TICKS = 6

/** Kod pokoju: 6 znaków z alfabetu bez łatwych do pomylenia `0/O/1/I` (spec versus-1v1). */
export const ROOM_CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
export const ROOM_CODE_LENGTH = 6
/** Odliczanie przed startem meczu. */
export const COUNTDOWN_MS = 3000

export const ACTIONS: readonly Action[] = [
  'left',
  'right',
  'rotateCw',
  'rotateCcw',
  'softDrop',
  'hardDrop',
  'hold',
]

export type ClientMessage =
  /** Pierwsza wiadomość po połączeniu; `resume` wznawia istniejącą sesję. */
  | { type: 'hello'; protocol: number; resume?: { sessionId: string; token: string } }
  /** Nowa gra (także restart w trakcie); serwer odpowiada wiadomością `game`. */
  | { type: 'newGame' }
  /** Akcje gracza wykonane na ticku `tick`; `seq` rośnie o 1 w obrębie gry. */
  | { type: 'input'; seq: number; tick: number; actions: Action[] }
  /** Pauza na ticku `tick` zegara klienta. */
  | { type: 'pause'; tick: number }
  | { type: 'resume' }
  /** Subskrypcja listy pokoi publicznych (`rooms` przy każdej zmianie) i jej koniec. */
  | { type: 'watchRooms' }
  | { type: 'unwatchRooms' }
  /** Nowy pokój; prywatny tylko dla zalogowanych. */
  | { type: 'createRoom'; visibility: RoomVisibility }
  | { type: 'joinRoom'; code: string }
  | { type: 'leaveRoom' }
  /** Gotowość do meczu (także do rewanżu po meczu). */
  | { type: 'ready' }

export type RoomVisibility = 'public' | 'private'
export type RoomState = 'waiting' | 'countdown' | 'playing' | 'finished'
/** Powód końca meczu z punktu widzenia przegranego. */
export type MatchEndReason = 'topout' | 'left' | 'timeout'

/** Pokój publiczny z wolnym miejscem na liście. */
export interface RoomSummary {
  code: string
  host: string
  /** Kiedy pokój powstał (ms od epoki), do pokazania czasu oczekiwania. */
  createdAt: number
}

export interface RoomPlayer {
  name: string
  host: boolean
  ready: boolean
  connected: boolean
}

/** Plansza przeciwnika w meczu: tyle, ile trzeba do jej narysowania. */
export type OpponentView = Pick<
  GameState,
  'board' | 'active' | 'garbage' | 'score' | 'lines' | 'linesSent' | 'status'
>

export type ErrorCode =
  | 'invalid'
  | 'rate_limited'
  | 'session_expired'
  | 'server_full'
  | 'version'
  | 'origin'
  /** Pokój nie istnieje lub jest już zamknięty. */
  | 'room_not_found'
  /** Pokój jest pełny albo mecz już trwa. */
  | 'room_full'
  /** Gracz ma już otwarty pokój. */
  | 'room_limit'
  /** Pokój prywatny wymaga zalogowania. */
  | 'login_required'

export type ServerMessage =
  /** Dane do wznowienia sesji po zerwaniu połączenia. */
  | { type: 'welcome'; sessionId: string; token: string }
  /** Pełny stan gry na początku gry lub po wznowieniu sesji; gra jest wtedy wstrzymana. */
  | { type: 'game'; tick: number; state: GameState; paused: boolean }
  /** Stan po `tick` tickach symulacji; `ackSeq` to ostatnia zastosowana akcja klienta. */
  | { type: 'snapshot'; tick: number; ackSeq: number; state: GameState }
  /** Koniec gry: wynik policzony przez serwer. */
  | { type: 'over'; score: number; lines: number; level: number }
  /** Lista pokoi publicznych z wolnym miejscem. */
  | { type: 'rooms'; rooms: RoomSummary[] }
  /** Stan pokoju gracza przy każdej zmianie; `startsAt` (ms od epoki) w trakcie odliczania. */
  | {
      type: 'room'
      code: string
      visibility: RoomVisibility
      state: RoomState
      players: RoomPlayer[]
      /** Indeks odbiorcy na liście `players`. */
      you: number
      startsAt?: number
    }
  /** Gracz opuścił pokój albo pokój został zamknięty. */
  | { type: 'roomClosed' }
  /** Start meczu albo powrót do niego po wznowieniu sesji; gra rusza od razu, bez pauzy. */
  | { type: 'match'; tick: number; state: GameState; opponent: OpponentView }
  /** Stan meczu: własna gra jak w `snapshot` i plansza przeciwnika. */
  | {
      type: 'matchSnapshot'
      tick: number
      ackSeq: number
      state: GameState
      opponent: OpponentView
    }
  /** Koniec meczu; `reason` opisuje przegraną. */
  | { type: 'result'; won: boolean; winner: string; reason: MatchEndReason }
  | { type: 'error'; code: ErrorCode }
