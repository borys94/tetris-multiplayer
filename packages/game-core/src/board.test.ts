import { describe, expect, it } from "vitest";
import {
  BOARD_WIDTH,
  TOTAL_ROWS,
  clearLines,
  collides,
  createEmptyBoard,
  dropDistance,
  isOccupied,
  lockPiece,
} from "./board";
import { boardFromRows } from "./test-utils";

describe("board", () => {
  it("creates an empty board with hidden rows", () => {
    const board = createEmptyBoard();

    expect(board).toHaveLength(TOTAL_ROWS);
    expect(board.every((row) => row.length === BOARD_WIDTH && row.every((c) => c === null))).toBe(
      true,
    );
  });

  it("treats walls and floor as occupied, space above the board as free", () => {
    const board = createEmptyBoard();

    expect(isOccupied(board, -1, 5)).toBe(true);
    expect(isOccupied(board, BOARD_WIDTH, 5)).toBe(true);
    expect(isOccupied(board, 0, TOTAL_ROWS)).toBe(true);
    expect(isOccupied(board, 0, -1)).toBe(false);
    expect(isOccupied(board, 0, 0)).toBe(false);
  });

  it("detects collisions with locked cells", () => {
    const board = boardFromRows(["####......"]);

    expect(collides(board, { type: "O", rotation: 0, x: 0, y: TOTAL_ROWS - 2 })).toBe(true);
    expect(collides(board, { type: "O", rotation: 0, x: 4, y: TOTAL_ROWS - 2 })).toBe(false);
  });

  it("locks a piece into the board without mutating the original", () => {
    const board = createEmptyBoard();
    const locked = lockPiece(board, { type: "O", rotation: 0, x: 0, y: TOTAL_ROWS - 2 });

    expect(locked[TOTAL_ROWS - 1]?.slice(0, 3)).toEqual(["O", "O", null]);
    expect(board[TOTAL_ROWS - 1]?.[0]).toBeNull();
  });

  it("clears full rows and shifts rows above down", () => {
    const board = boardFromRows(["#.........", "##########", "..#.......", "##########"]);
    const { board: result, cleared } = clearLines(board);

    expect(cleared).toBe(2);
    expect(result).toEqual(boardFromRows(["#.........", "..#......."]));
  });

  it("returns the same board when nothing is cleared", () => {
    const board = boardFromRows(["#........."]);

    expect(clearLines(board)).toEqual({ board, cleared: 0 });
  });

  it("measures the drop distance to the stack", () => {
    const board = boardFromRows(["##########"]);

    expect(dropDistance(board, { type: "O", rotation: 0, x: 0, y: 0 })).toBe(TOTAL_ROWS - 3);
  });
});
