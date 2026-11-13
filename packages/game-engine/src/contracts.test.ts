/**
 * Compile-time contract tests (specs/006-game-domain-model AC-001, AC-002).
 * Type assertions are checked by `tsc` (`yarn typecheck`); `@ts-expect-error` fails the build
 * if the expected error disappears. Imports go through the public entry point only.
 */
import { describe, expectTypeOf, it } from 'vitest';
import type {
  ActivePiece,
  Board,
  Cell,
  GameConfig,
  GameState,
  GameStatus,
  PieceKind,
  Rotation,
} from './index.js';

const board: Board = {
  width: 2,
  height: 2,
  rows: [
    [null, null],
    [null, 'T'],
  ],
};

const state: GameState = { board, activePiece: null, score: 0, status: 'idle' };

describe('GameState contract', () => {
  it('exposes exactly board, activePiece, score and status (no transport data such as socketId)', () => {
    expectTypeOf<keyof GameState>().toEqualTypeOf<'board' | 'activePiece' | 'score' | 'status'>();
    expectTypeOf<GameState['board']>().toEqualTypeOf<Board>();
    expectTypeOf<GameState['activePiece']>().toEqualTypeOf<ActivePiece | null>();
    expectTypeOf<GameState['score']>().toEqualTypeOf<number>();
    expectTypeOf<GameState['status']>().toEqualTypeOf<GameStatus>();
  });

  it('defines the approved status set', () => {
    expectTypeOf<GameStatus>().toEqualTypeOf<'idle' | 'playing' | 'paused' | 'game-over'>();
    // @ts-expect-error — unknown status
    const invalid: GameStatus = 'finished';
    void invalid;
  });

  it('rejects mutation of top-level fields', () => {
    const copy: GameState = { ...state };
    // @ts-expect-error — readonly
    copy.score = 1;
    // @ts-expect-error — readonly
    copy.status = 'playing';
    // @ts-expect-error — readonly
    copy.activePiece = null;
    // @ts-expect-error — readonly
    copy.board = board;
  });

  it('rejects mutation of nested board data', () => {
    const rows = [[null]] as Cell[][];
    const local: Board = { width: 1, height: 1, rows };
    // @ts-expect-error — readonly array of rows
    local.rows.push([null]);
    const firstRow = local.rows[0];
    if (firstRow) {
      // @ts-expect-error — readonly row
      firstRow[0] = 'I';
    }
    // @ts-expect-error — readonly
    local.width = 3;
  });
});

describe('piece and config contracts', () => {
  it('limits piece kinds, rotations and cells', () => {
    expectTypeOf<PieceKind>().toEqualTypeOf<'I' | 'J' | 'L' | 'O' | 'S' | 'T' | 'Z'>();
    expectTypeOf<Rotation>().toEqualTypeOf<0 | 1 | 2 | 3>();
    expectTypeOf<Cell>().toEqualTypeOf<PieceKind | null>();
    expectTypeOf<keyof ActivePiece>().toEqualTypeOf<'kind' | 'rotation' | 'position'>();
  });

  it('rejects mutation of the active piece and config', () => {
    const piece: ActivePiece = { kind: 'T', rotation: 0, position: { x: 4, y: 0 } };
    // @ts-expect-error — readonly
    piece.rotation = 1;
    // @ts-expect-error — readonly nested position
    piece.position.x = 5;
    // @ts-expect-error — rotation outside 0..3
    const badRotation: Rotation = 4;
    void badRotation;

    const config: GameConfig = { boardWidth: 10, boardHeight: 20 };
    // @ts-expect-error — readonly
    config.boardWidth = 12;
    expectTypeOf<keyof GameConfig>().toEqualTypeOf<'boardWidth' | 'boardHeight'>();
  });
});
