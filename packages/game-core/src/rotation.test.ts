import { describe, expect, it } from "vitest";
import { createEmptyBoard } from "./board";
import { pieceCells, type Piece } from "./pieces";
import { rotate } from "./rotation";
import { boardFilledExcept } from "./test-utils";

describe("rotate", () => {
  it("rotates in open space without a kick", () => {
    const piece: Piece = { type: "T", rotation: 0, x: 3, y: 5 };

    expect(rotate(createEmptyBoard(), piece, 1)).toEqual({ ...piece, rotation: 1 });
    expect(rotate(createEmptyBoard(), piece, -1)).toEqual({ ...piece, rotation: 3 });
  });

  it("kicks off the left wall when rotating would overlap it (S2)", () => {
    const piece: Piece = { type: "T", rotation: 1, x: -1, y: 5 };

    expect(rotate(createEmptyBoard(), piece, -1)).toEqual({ ...piece, rotation: 0, x: 0 });
  });

  it("kicks the I piece off the right wall", () => {
    const piece: Piece = { type: "I", rotation: 1, x: 7, y: 5 };
    const rotated = rotate(createEmptyBoard(), piece, 1);

    expect(rotated?.rotation).toBe(2);
    expect(pieceCells(rotated!).every(({ x }) => x >= 0 && x < 10)).toBe(true);
  });

  it("returns null when no kick fits (S2)", () => {
    const piece: Piece = { type: "I", rotation: 0, x: 3, y: 10 };
    const board = boardFilledExcept(pieceCells(piece));

    expect(rotate(board, piece, 1)).toBeNull();
    expect(rotate(board, piece, -1)).toBeNull();
  });

  it("does not rotate the O piece", () => {
    expect(rotate(createEmptyBoard(), { type: "O", rotation: 0, x: 4, y: 5 }, 1)).toBeNull();
  });
});
