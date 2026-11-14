import { describe, expect, it } from "vitest";
import { BOARD_WIDTH, TOTAL_ROWS } from "./board";
import { applyAction, createGame, receiveGarbage, type GameState } from "./game";
import {
  GARBAGE_CELL,
  attackLines,
  cancelGarbage,
  garbageLines,
  insertGarbage,
  randomHole,
} from "./garbage";
import { boardFromRows } from "./test-utils";

const I_VERTICAL_AT_9 = { type: "I", rotation: 1, x: 7, y: 0 } as const;
const TETRIS_READY = ["#########.", "#########.", "#########.", "#########."];

function garbageRow(hole: number): (string | null)[] {
  return Array.from({ length: BOARD_WIDTH }, (_, x) => (x === hole ? null : GARBAGE_CELL));
}

describe("attackLines", () => {
  it.each([
    [0, 0],
    [1, 0],
    [2, 1],
    [3, 2],
    [4, 4],
  ])("clearing %i lines sends %i", (cleared, sent) => {
    expect(attackLines(cleared)).toBe(sent);
  });
});

describe("cancelGarbage", () => {
  it("cancels whole and partial batches from the front", () => {
    const queue = [
      { lines: 1, hole: 0 },
      { lines: 3, hole: 5 },
    ];

    expect(cancelGarbage(queue, 2)).toEqual({ queue: [{ lines: 2, hole: 5 }], remaining: 0 });
    expect(cancelGarbage(queue, 6)).toEqual({ queue: [], remaining: 2 });
    expect(cancelGarbage([], 4)).toEqual({ queue: [], remaining: 4 });
    expect(garbageLines(queue)).toBe(4);
  });
});

describe("insertGarbage", () => {
  it("pushes the board up and adds rows with the batch hole", () => {
    const board = boardFromRows(["#.........", "##........"]);
    const result = insertGarbage(board, [
      { lines: 1, hole: 3 },
      { lines: 2, hole: 7 },
    ]);

    expect(result.toppedOut).toBe(false);
    expect(result.board).toHaveLength(TOTAL_ROWS);
    expect(result.board.slice(-3)).toEqual([garbageRow(3), garbageRow(7), garbageRow(7)]);
    expect(result.board.slice(-5, -3)).toEqual(board.slice(-2));
  });

  it("reports a top out when occupied cells leave the board", () => {
    const board = boardFromRows([
      "#.........",
      ...Array<string>(TOTAL_ROWS - 1).fill(".........."),
    ]);

    expect(insertGarbage(board, [{ lines: 1, hole: 0 }]).toppedOut).toBe(true);
  });
});

describe("randomHole", () => {
  it("is deterministic and stays on the board", () => {
    let rng = 42;
    const holes: number[] = [];
    for (let i = 0; i < 100; i++) {
      const step = randomHole(rng);
      holes.push(step.hole);
      rng = step.rng;
    }

    expect(holes.every((hole) => hole >= 0 && hole < BOARD_WIDTH)).toBe(true);
    expect(randomHole(42)).toEqual(randomHole(42));
    expect(new Set(holes).size).toBeGreaterThan(5);
  });
});

describe("garbage in a game (S3)", () => {
  function withBoard(rows: readonly string[], garbage: GameState["garbage"] = []): GameState {
    return { ...createGame(5), board: boardFromRows(rows), active: I_VERTICAL_AT_9, garbage };
  }

  it("cancels own queue first and sends the rest", () => {
    const result = applyAction(withBoard(TETRIS_READY, [{ lines: 2, hole: 4 }]), "hardDrop");

    expect(result.garbage).toEqual([]);
    expect(result.linesSent).toBe(2);
    expect(result.board).toEqual(boardFromRows([]));
  });

  it("sends the full attack with an empty queue", () => {
    expect(applyAction(withBoard(TETRIS_READY), "hardDrop").linesSent).toBe(4);
  });

  it("inserts the queue when a piece locks without clearing", () => {
    const state = receiveGarbage(withBoard([]), { lines: 4, hole: 2 });
    const result = applyAction(state, "hardDrop");

    expect(result.garbage).toEqual([]);
    expect(result.status).toBe("playing");
    expect(result.board.slice(-4)).toEqual(Array.from({ length: 4 }, () => garbageRow(2)));
    expect(result.board[TOTAL_ROWS - 5]?.[9]).toBe("I");
  });

  it("tops out when garbage pushes blocks off the board", () => {
    const rows = Array.from({ length: TOTAL_ROWS - 5 }, () => "#.#.#.#.#.");
    const state = receiveGarbage(withBoard(rows), { lines: 4, hole: 0 });

    expect(applyAction({ ...state, active: { ...state.active, x: 2 } }, "hardDrop").status).toBe(
      "over",
    );
  });

  it("ignores garbage after game over and empty batches", () => {
    const state = withBoard([]);

    expect(receiveGarbage({ ...state, status: "over" }, { lines: 2, hole: 0 }).garbage).toEqual([]);
    expect(receiveGarbage(state, { lines: 0, hole: 0 })).toBe(state);
  });
});
