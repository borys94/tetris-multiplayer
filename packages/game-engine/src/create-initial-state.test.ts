/**
 * Runtime tests of the initial state factory (specs/006-game-domain-model AC-003, AC-004, AC-005).
 * Compile-time guarantees (readonly) are covered in contracts.test.ts.
 */
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createInitialGameState, type GameConfig } from './index.js';

const STANDARD: GameConfig = { boardWidth: 10, boardHeight: 20 };

afterEach(() => {
  vi.restoreAllMocks();
});

describe('createInitialGameState — initial state (AC-003)', () => {
  it('starts idle, with score 0 and no active piece', () => {
    const state = createInitialGameState(STANDARD);

    expect(state.status).toBe('idle');
    expect(state.score).toBe(0);
    expect(state.activePiece).toBeNull();
  });

  it.each([
    [1, 1],
    [10, 20],
    [30, 30],
  ])('creates an empty %i x %i board', (boardWidth, boardHeight) => {
    const { board } = createInitialGameState({ boardWidth, boardHeight });

    expect(board.width).toBe(boardWidth);
    expect(board.height).toBe(boardHeight);
    expect(board.rows).toEqual(Array.from({ length: boardHeight }, () => Array(boardWidth).fill(null)));
  });

  it('is deterministic: equivalent configs give equal, independent values', () => {
    const random = vi.spyOn(Math, 'random');
    const now = vi.spyOn(Date, 'now');

    const first = createInitialGameState(STANDARD);
    const second = createInitialGameState({ ...STANDARD });

    expect(second).toEqual(first);
    expect(second).not.toBe(first);
    expect(random).not.toHaveBeenCalled();
    expect(now).not.toHaveBeenCalled();
  });
});

describe('createInitialGameState — config validation (AC-004)', () => {
  const invalid = [0, -10, 1.5, Number.NaN, Number.POSITIVE_INFINITY, Number.MAX_SAFE_INTEGER + 1, 31];

  it.each(invalid)('rejects boardWidth %d', (boardWidth) => {
    expect(() => createInitialGameState({ ...STANDARD, boardWidth })).toThrow(RangeError);
  });

  it.each(invalid)('rejects boardHeight %d', (boardHeight) => {
    expect(() => createInitialGameState({ ...STANDARD, boardHeight })).toThrow(RangeError);
  });

  it('names the invalid field in the error message', () => {
    expect(() => createInitialGameState({ ...STANDARD, boardHeight: 0 })).toThrow(/boardHeight/);
  });
});

describe('createInitialGameState — input immutability (AC-005)', () => {
  it('does not modify the config object', () => {
    const config = { boardWidth: 10, boardHeight: 20 };

    // A frozen config makes any write attempt throw in ESM strict mode.
    createInitialGameState(Object.freeze(config));

    expect(config).toEqual({ boardWidth: 10, boardHeight: 20 });
  });
});
