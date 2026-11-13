/**
 * Runtime tests of the initial state factory (specs/006-game-domain-model AC-003, AC-004, AC-005).
 * Compile-time guarantees (readonly) are covered separately in contracts.test.ts.
 */
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createInitialGameState, type GameConfig } from './index.js';

const STANDARD: GameConfig = { boardWidth: 10, boardHeight: 20 };

afterEach(() => {
  vi.restoreAllMocks();
});

describe('createInitialGameState — initial state invariants (AC-003, SPEC-006)', () => {
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
    [4, 30],
  ])('creates an empty %i x %i board', (boardWidth, boardHeight) => {
    const { board } = createInitialGameState({ boardWidth, boardHeight });

    expect(board.width).toBe(boardWidth);
    expect(board.height).toBe(boardHeight);
    expect(board.rows).toHaveLength(boardHeight);
    for (const row of board.rows) {
      expect(row).toHaveLength(boardWidth);
      expect(row.every((cell) => cell === null)).toBe(true);
    }
  });

  it('uses a separate array for every row', () => {
    const { board } = createInitialGameState(STANDARD);

    expect(new Set(board.rows).size).toBe(board.height);
  });
});

describe('createInitialGameState — determinism (AC-003, SPEC-003)', () => {
  it('returns deeply equal, independent values for equivalent configs', () => {
    const first = createInitialGameState(STANDARD);
    const second = createInitialGameState({ boardWidth: 10, boardHeight: 20 });

    expect(second).toEqual(first);
    expect(second).not.toBe(first);
    expect(second.board.rows).not.toBe(first.board.rows);
  });

  it('reads neither the clock nor randomness', () => {
    const random = vi.spyOn(Math, 'random');
    const now = vi.spyOn(Date, 'now');

    createInitialGameState(STANDARD);

    expect(random).not.toHaveBeenCalled();
    expect(now).not.toHaveBeenCalled();
  });
});

describe('createInitialGameState — config validation (AC-004, SPEC-004)', () => {
  const invalid: readonly (readonly [string, number])[] = [
    ['zero', 0],
    ['negative', -10],
    ['fraction', 1.5],
    ['NaN', Number.NaN],
    ['Infinity', Number.POSITIVE_INFINITY],
    ['-Infinity', Number.NEGATIVE_INFINITY],
    ['unsafe integer', Number.MAX_SAFE_INTEGER + 1],
    ['above the limit', 31],
  ];

  it.each(invalid)('rejects boardWidth: %s', (_label, boardWidth) => {
    expect(() => createInitialGameState({ boardWidth, boardHeight: 20 })).toThrow(RangeError);
    expect(() => createInitialGameState({ boardWidth, boardHeight: 20 })).toThrow(/boardWidth/);
  });

  it.each(invalid)('rejects boardHeight: %s', (_label, boardHeight) => {
    expect(() => createInitialGameState({ boardWidth: 10, boardHeight })).toThrow(RangeError);
    expect(() => createInitialGameState({ boardWidth: 10, boardHeight })).toThrow(/boardHeight/);
  });

  it('accepts the boundary values 1 and 30 for both dimensions', () => {
    expect(() => createInitialGameState({ boardWidth: 1, boardHeight: 1 })).not.toThrow();
    expect(() => createInitialGameState({ boardWidth: 30, boardHeight: 30 })).not.toThrow();
  });
});

describe('createInitialGameState — immutability of input (AC-005, SPEC-005)', () => {
  it('does not modify the config object', () => {
    const config = { boardWidth: 10, boardHeight: 20 };
    const snapshot = { ...config }; // config is flat, a shallow copy is a full snapshot

    // A frozen config makes any write attempt throw in ESM strict mode.
    createInitialGameState(Object.freeze(config));

    expect(config).toEqual(snapshot);
  });

  it('does not keep a reference to the config object in the state', () => {
    const config: GameConfig = { boardWidth: 10, boardHeight: 20 };
    const state = createInitialGameState(config);

    expect(Object.values(state)).not.toContain(config);
    expect(Object.values(state.board)).not.toContain(config);
  });
});
