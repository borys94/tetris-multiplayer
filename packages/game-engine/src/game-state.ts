/**
 * State of a single game (one player). Match coordination lives outside the engine.
 * See specs/006-game-domain-model/design.md D-001, D-008.
 */
import type { Board } from './board.js';
import type { ActivePiece } from './piece.js';

/** `paused` is used by single-player only; transitions are out of scope for lesson 06. */
export type GameStatus = 'idle' | 'playing' | 'paused' | 'game-over';

export interface GameState {
  readonly board: Board;
  readonly activePiece: ActivePiece | null;
  readonly score: number;
  readonly status: GameStatus;
}
