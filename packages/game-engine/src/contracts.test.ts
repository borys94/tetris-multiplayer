/**
 * Compile-time immutability tests (specs/006-game-domain-model AC-002, SPEC-005).
 * Removing `readonly` breaks nothing else, so each `@ts-expect-error` below fails `yarn typecheck`
 * (TS2578) when the protection disappears. Imports go through the public entry point only.
 */
import { describe, it } from 'vitest';
import type { ActivePiece, Board, Cell, GameConfig, GameState } from './index.js';

describe('readonly contracts', () => {
  it('rejects mutation of GameState fields', () => {
    const board: Board = { width: 1, height: 1, rows: [[null]] };
    const state: GameState = { board, activePiece: null, score: 0, status: 'idle' };
    // @ts-expect-error — readonly
    state.score = 1;
    // @ts-expect-error — readonly
    state.status = 'playing';
    // @ts-expect-error — readonly
    state.activePiece = null;
    // @ts-expect-error — readonly
    state.board = board;
  });

  it('rejects mutation of nested board data', () => {
    const board: Board = { width: 1, height: 1, rows: [[null]] as Cell[][] };
    // @ts-expect-error — readonly
    board.width = 3;
    // @ts-expect-error — readonly array of rows
    board.rows.push([null]);
    const firstRow = board.rows[0];
    if (firstRow) {
      // @ts-expect-error — readonly row
      firstRow[0] = 'I';
    }
  });

  it('rejects mutation of the active piece and config', () => {
    const piece: ActivePiece = { kind: 'T', rotation: 0, position: { x: 4, y: 0 } };
    // @ts-expect-error — readonly
    piece.rotation = 1;
    // @ts-expect-error — readonly nested position
    piece.position.x = 5;

    const config: GameConfig = { boardWidth: 10, boardHeight: 20 };
    // @ts-expect-error — readonly
    config.boardWidth = 12;
  });
});
