import { describe, expect, it } from "vitest";
import { TOTAL_ROWS } from "./board";
import {
  LOCK_DELAY_TICKS,
  MAX_LOCK_RESETS,
  applyAction,
  createGame,
  ghostPiece,
  previewQueue,
  tick,
  type Action,
  type GameState,
} from "./game";
import { PIECE_TYPES, type PieceType } from "./pieces";
import { boardFromRows } from "./test-utils";

function run(state: GameState, steps: readonly (Action | "tick")[]): GameState {
  return steps.reduce((s, step) => (step === "tick" ? tick(s) : applyAction(s, step)), state);
}

function ticks(state: GameState, count: number): GameState {
  return run(
    state,
    Array.from({ length: count }, () => "tick" as const),
  );
}

function spawnOrder(seed: number, count: number): PieceType[] {
  const order: PieceType[] = [];
  let state = createGame(seed);
  while (order.length < count) {
    order.push(state.active.type);
    state = applyAction(state, "hold");
    state = { ...state, board: boardFromRows([]), canHold: true, hold: null };
  }
  return order;
}

describe("createGame", () => {
  it("starts a playing game with an active piece and a preview", () => {
    const state = createGame(1);

    expect(state.status).toBe("playing");
    expect(state.score).toBe(0);
    expect(state.level).toBe(1);
    expect(previewQueue(state)).toHaveLength(3);
  });
});

describe("determinism (S1)", () => {
  const steps: (Action | "tick")[] = [
    ...Array.from({ length: 200 }, (_, i): Action | "tick" =>
      i % 7 === 0 ? "hardDrop" : i % 5 === 0 ? "rotateCw" : i % 3 === 0 ? "left" : "tick",
    ),
    "hold",
    "right",
    "softDrop",
  ];

  it("produces identical state for the same seed and inputs", () => {
    expect(run(createGame(123), steps)).toEqual(run(createGame(123), steps));
  });

  it("produces a different sequence for a different seed", () => {
    expect(spawnOrder(1, 14)).not.toEqual(spawnOrder(2, 14));
  });

  it("deals every piece exactly once per bag of 7", () => {
    const order = spawnOrder(99, 21);
    for (let bag = 0; bag < 3; bag++) {
      expect(order.slice(bag * 7, bag * 7 + 7).sort()).toEqual([...PIECE_TYPES].sort());
    }
  });
});

describe("movement", () => {
  it("moves left and right until blocked by a wall", () => {
    const state = createGame(5);
    const left = run(
      state,
      Array.from({ length: 10 }, () => "left" as const),
    );

    expect(applyAction(left, "left")).toBe(left);
    expect(applyAction(state, "right").active.x).toBe(state.active.x + 1);
  });

  it("soft drop moves down one row and scores 1 point", () => {
    const state = createGame(5);
    const dropped = applyAction(state, "softDrop");

    expect(dropped.active.y).toBe(state.active.y + 1);
    expect(dropped.score).toBe(1);
  });

  it("ghost piece shows the landing position", () => {
    const state = createGame(5);

    expect(ghostPiece(state).y).toBeGreaterThan(state.active.y);
    expect(applyAction(state, "hardDrop").board).toContainEqual(
      expect.arrayContaining([state.active.type]),
    );
  });
});

describe("gravity and locking", () => {
  it("falls one row after gravity ticks at level 1", () => {
    const state = createGame(5);

    expect(ticks(state, 59).active.y).toBe(state.active.y);
    expect(ticks(state, 60).active.y).toBe(state.active.y + 1);
  });

  it("locks after the lock delay once grounded", () => {
    const state = {
      ...createGame(5),
      active: { type: "O" as const, rotation: 0 as const, x: 0, y: TOTAL_ROWS - 2 },
    };
    const before = ticks(state, LOCK_DELAY_TICKS - 1);
    const after = tick(before);

    expect(before.board[TOTAL_ROWS - 1]?.[0]).toBeNull();
    expect(after.board[TOTAL_ROWS - 1]?.[0]).toBe("O");
    expect(after.active.y).toBe(0);
  });

  it("resets the lock delay on move, at most MAX_LOCK_RESETS times", () => {
    let state: GameState = {
      ...createGame(5),
      active: { type: "O", rotation: 0, x: 0, y: TOTAL_ROWS - 2 },
    };
    for (let i = 0; i < MAX_LOCK_RESETS; i++) {
      state = ticks(state, LOCK_DELAY_TICKS - 1);
      state = applyAction(state, i % 2 === 0 ? "right" : "left");
      expect(state.lockCounter).toBe(0);
    }
    state = ticks(state, LOCK_DELAY_TICKS - 1);
    state = applyAction(state, "right");

    expect(state.lockCounter).toBe(LOCK_DELAY_TICKS - 1);
  });
});

describe("line clears (S3)", () => {
  it("clears four lines with an I piece and scores 800 × level plus hard drop", () => {
    const board = boardFromRows(["#########.", "#########.", "#########.", "#########."]);
    const state: GameState = {
      ...createGame(5),
      board,
      level: 2,
      active: { type: "I", rotation: 1, x: 7, y: 0 },
    };
    const distance = ghostPiece(state).y - state.active.y;
    const result = applyAction(state, "hardDrop");

    expect(result.lines).toBe(4);
    expect(result.score).toBe(800 * 2 + distance * 2);
    expect(result.board).toEqual(boardFromRows([]));
  });

  it("raises the level after 10 lines", () => {
    const state: GameState = {
      ...createGame(5),
      lines: 9,
      board: boardFromRows(["#########."]),
      active: { type: "I", rotation: 1, x: 7, y: 0 },
    };

    expect(applyAction(state, "hardDrop").level).toBe(2);
  });
});

describe("hold", () => {
  it("stores the active piece and spawns the next one", () => {
    const state = createGame(5);
    const held = applyAction(state, "hold");

    expect(held.hold).toBe(state.active.type);
    expect(held.active.type).toBe(state.queue[0]);
    expect(held.canHold).toBe(false);
  });

  it("allows only one hold per piece and swaps after a lock", () => {
    const held = applyAction(createGame(5), "hold");

    expect(applyAction(held, "hold")).toBe(held);

    const locked = applyAction(held, "hardDrop");
    const swapped = applyAction(locked, "hold");

    expect(swapped.active.type).toBe(held.hold);
    expect(swapped.hold).toBe(locked.active.type);
  });
});

describe("game over (S4)", () => {
  it("ends when a new piece cannot spawn and ignores further input", () => {
    const blocked = boardFromRows([]).map((row, y) =>
      y === 1 ? row.map((_, x) => (x >= 3 && x <= 6 ? "Z" : null)) : row,
    );
    const state: GameState = {
      ...createGame(5),
      board: blocked,
      active: { type: "O", rotation: 0, x: 0, y: TOTAL_ROWS - 2 },
    };
    const over = applyAction(state, "hardDrop");

    expect(over.status).toBe("over");
    expect(tick(over)).toBe(over);
    expect(applyAction(over, "left")).toBe(over);
  });
});
