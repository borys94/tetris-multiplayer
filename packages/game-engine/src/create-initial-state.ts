/**
 * Deterministic factory of the initial game state.
 * See specs/006-game-domain-model/spec.md SPEC-003 and design.md D-003.
 */
import type { BoardRow, Cell } from './board.js';
import { validateGameConfig, type GameConfig } from './game-config.js';
import type { GameState } from './game-state.js';

/**
 * Creates an `idle` game with score 0, no active piece and an empty board.
 * Pure: no time, randomness or global state; the config is only read.
 *
 * @throws {RangeError} when a board dimension is not an integer in 1..30.
 */
export function createInitialGameState(config: GameConfig): GameState {
  validateGameConfig(config);

  const { boardWidth: width, boardHeight: height } = config;
  // A separate array per row, so future transitions can replace rows independently.
  const rows: BoardRow[] = Array.from({ length: height }, () =>
    Array.from({ length: width }, (): Cell => null),
  );

  return {
    board: { width, height, rows },
    activePiece: null,
    score: 0,
    status: 'idle',
  };
}
