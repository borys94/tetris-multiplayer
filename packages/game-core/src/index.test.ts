import { describe, expect, it } from "vitest";
import { BOARD_HEIGHT, BOARD_WIDTH, createEmptyBoard } from "./index";

describe("createEmptyBoard", () => {
  it("creates an empty board with standard dimensions", () => {
    const board = createEmptyBoard();

    expect(board).toHaveLength(BOARD_HEIGHT);
    expect(
      board.every((row) => row.length === BOARD_WIDTH && row.every((cell) => cell === 0)),
    ).toBe(true);
  });
});
