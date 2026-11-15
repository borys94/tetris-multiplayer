import type { MatchEndReason, RoomState, RoomVisibility } from "@tetris/protocol";

/** Odpowiedzi API serwera (spec 005, 007); daty przychodzą jako ISO w JSON-ie. */

export interface Account {
  id: number;
  username: string;
  /** `null` oznacza gracza. */
  role: "admin" | null;
}

export interface SavedGame {
  id: number;
  score: number;
  lines: number;
  level: number;
  ticks: number;
  endedAt: string;
}

export interface LeaderboardEntry {
  rank: number;
  gameId: number;
  username: string;
  score: number;
  lines: number;
  level: number;
  endedAt: string;
}

export interface AdminUser extends Account {
  disabled: boolean;
  createdAt: string;
}

export interface UserChanges {
  role?: "admin" | null;
  disabled?: boolean;
}

/** Mecz 1v1 z punktu widzenia gracza (spec 007). */
export interface PlayerMatch {
  id: number;
  won: boolean;
  opponent: string;
  reason: MatchEndReason;
  linesSent: number;
  linesReceived: number;
  ticks: number;
  endedAt: string;
}

/** Zakończony mecz w panelu admina. */
export interface AdminMatch {
  id: number;
  winnerName: string;
  loserName: string;
  reason: MatchEndReason;
  winnerLinesSent: number;
  loserLinesSent: number;
  ticks: number;
  endedAt: string;
}

/** Otwarty pokój w panelu admina (stan z pamięci serwera). */
export interface AdminRoom {
  code: string;
  visibility: RoomVisibility;
  state: RoomState;
  host: string;
  createdAt: number;
  players: { name: string; userId: number | null; connected: boolean }[];
  match: {
    seconds: number;
    players: { name: string; score: number; lines: number; linesSent: number }[];
  } | null;
}

/** Rozmiar listy z serwera (`LIST_LIMIT`); pełna strona meczów oznacza, że mogą być starsze. */
export const PAGE_SIZE = 50;
