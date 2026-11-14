import type { Action, GameState } from "@tetris/game-core";

/** Wersja protokołu; klient wysyła ją w `hello`, przy niezgodności serwer odpowiada błędem `version`. */
export const PROTOCOL_VERSION = 1;
/** Maksymalny rozmiar wiadomości od klienta w bajtach. */
export const MAX_MESSAGE_BYTES = 1024;
/** Maksymalna liczba akcji w jednej wiadomości `input` (wszystkie z tego samego ticka). */
export const MAX_ACTIONS_PER_INPUT = 8;
/** Co ile ticków symulacji serwer wysyła snapshot (10/s). */
export const SNAPSHOT_INTERVAL_TICKS = 6;

export const ACTIONS: readonly Action[] = [
  "left",
  "right",
  "rotateCw",
  "rotateCcw",
  "softDrop",
  "hardDrop",
  "hold",
];

export type ClientMessage =
  /** Pierwsza wiadomość po połączeniu; `resume` wznawia istniejącą sesję. */
  | { type: "hello"; protocol: number; resume?: { sessionId: string; token: string } }
  /** Nowa gra (także restart w trakcie); serwer odpowiada wiadomością `game`. */
  | { type: "newGame" }
  /** Akcje gracza wykonane na ticku `tick`; `seq` rośnie o 1 w obrębie gry. */
  | { type: "input"; seq: number; tick: number; actions: Action[] }
  /** Pauza na ticku `tick` zegara klienta. */
  | { type: "pause"; tick: number }
  | { type: "resume" };

export type ErrorCode =
  "invalid" | "rate_limited" | "session_expired" | "server_full" | "version" | "origin";

export type ServerMessage =
  /** Dane do wznowienia sesji po zerwaniu połączenia. */
  | { type: "welcome"; sessionId: string; token: string }
  /** Pełny stan gry na początku gry lub po wznowieniu sesji; gra jest wtedy wstrzymana. */
  | { type: "game"; tick: number; state: GameState; paused: boolean }
  /** Stan po `tick` tickach symulacji; `ackSeq` to ostatnia zastosowana akcja klienta. */
  | { type: "snapshot"; tick: number; ackSeq: number; state: GameState }
  /** Koniec gry: wynik policzony przez serwer. */
  | { type: "over"; score: number; lines: number; level: number }
  | { type: "error"; code: ErrorCode };
