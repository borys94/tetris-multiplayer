/**
 * Public API of the game engine.
 */
export const ENGINE_API_VERSION = 0 as const;

export type { Board, BoardRow, Cell } from './board.js';
export type { GameConfig } from './game-config.js';
export type { GameState, GameStatus } from './game-state.js';
export type { ActivePiece, PieceKind, Position, Rotation } from './piece.js';
