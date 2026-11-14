export type PieceType = "I" | "O" | "T" | "S" | "Z" | "J" | "L";
export type Rotation = 0 | 1 | 2 | 3;

export const PIECE_TYPES: readonly PieceType[] = ["I", "O", "T", "S", "Z", "J", "L"];

export interface Point {
  readonly x: number;
  readonly y: number;
}

/** Klocek na planszy: (x, y) to lewy górny róg jego kwadratowego obszaru. */
export interface Piece {
  readonly type: PieceType;
  readonly rotation: Rotation;
  readonly x: number;
  readonly y: number;
}

type RotationCells = readonly [Point[], Point[], Point[], Point[]];

const SPAWN_SHAPES: Record<PieceType, readonly string[]> = {
  I: ["....", "XXXX", "....", "...."],
  O: ["XX", "XX"],
  T: [".X.", "XXX", "..."],
  S: [".XX", "XX.", "..."],
  Z: ["XX.", ".XX", "..."],
  J: ["X..", "XXX", "..."],
  L: ["..X", "XXX", "..."],
};

function parseShape(rows: readonly string[]): Point[] {
  return rows.flatMap((row, y) => [...row].flatMap((char, x) => (char === "X" ? [{ x, y }] : [])));
}

function rotateClockwise(cells: Point[], size: number): Point[] {
  return cells.map(({ x, y }) => ({ x: size - 1 - y, y: x }));
}

function buildRotations(rows: readonly string[]): RotationCells {
  const size = rows.length;
  const r0 = parseShape(rows);
  const r1 = rotateClockwise(r0, size);
  const r2 = rotateClockwise(r1, size);
  const r3 = rotateClockwise(r2, size);
  return [r0, r1, r2, r3];
}

const PIECE_CELLS: Record<PieceType, RotationCells> = {
  I: buildRotations(SPAWN_SHAPES.I),
  O: buildRotations(SPAWN_SHAPES.O),
  T: buildRotations(SPAWN_SHAPES.T),
  S: buildRotations(SPAWN_SHAPES.S),
  Z: buildRotations(SPAWN_SHAPES.Z),
  J: buildRotations(SPAWN_SHAPES.J),
  L: buildRotations(SPAWN_SHAPES.L),
};

/** Komórki klocka we współrzędnych planszy. */
export function pieceCells(piece: Piece): Point[] {
  return PIECE_CELLS[piece.type][piece.rotation].map(({ x, y }) => ({
    x: x + piece.x,
    y: y + piece.y,
  }));
}

/** Komórki klocka w jego własnym obszarze (do podglądu hold/next). */
export function shapeCells(type: PieceType): Point[] {
  return PIECE_CELLS[type][0];
}

export function spawnPiece(type: PieceType): Piece {
  return { type, rotation: 0, x: type === "O" ? 4 : 3, y: 0 };
}
