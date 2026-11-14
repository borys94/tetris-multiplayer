import { describe, expect, it } from "vitest";
import { PIECE_TYPES, pieceCells, shapeCells, spawnPiece, type Rotation } from "./pieces";

describe("pieces", () => {
  it.each(PIECE_TYPES)("%s has 4 distinct cells in every rotation", (type) => {
    for (const rotation of [0, 1, 2, 3] as Rotation[]) {
      const cells = pieceCells({ type, rotation, x: 0, y: 0 });
      expect(new Set(cells.map(({ x, y }) => `${x},${y}`)).size).toBe(4);
    }
  });

  it("rotates T clockwise around its centre", () => {
    expect(pieceCells({ type: "T", rotation: 1, x: 0, y: 0 })).toEqual(
      expect.arrayContaining([
        { x: 1, y: 0 },
        { x: 1, y: 1 },
        { x: 2, y: 1 },
        { x: 1, y: 2 },
      ]),
    );
  });

  it("offsets cells by the piece position", () => {
    expect(pieceCells({ type: "O", rotation: 0, x: 4, y: 7 })).toEqual([
      { x: 4, y: 7 },
      { x: 5, y: 7 },
      { x: 4, y: 8 },
      { x: 5, y: 8 },
    ]);
  });

  it("spawns pieces centred in the hidden rows", () => {
    expect(spawnPiece("T")).toEqual({ type: "T", rotation: 0, x: 3, y: 0 });
    expect(spawnPiece("O")).toEqual({ type: "O", rotation: 0, x: 4, y: 0 });
    expect(shapeCells("I")).toHaveLength(4);
  });
});
