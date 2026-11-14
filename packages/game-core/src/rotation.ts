import { collides, type Board } from "./board";
import type { Piece, Rotation } from "./pieces";

type Kick = readonly [dx: number, dy: number];
type Transition = `${Rotation}>${Rotation}`;

/**
 * Tabele wall kicków w konwencji „y w górę”, standardowej dla gatunku.
 * `toBoardKicks` odwraca oś y, bo na planszy y rośnie w dół.
 */
// prettier-ignore
const JLSTZ_KICKS: Partial<Record<Transition, readonly Kick[]>> = {
  "0>1": [[0, 0], [-1, 0], [-1, 1], [0, -2], [-1, -2]],
  "1>0": [[0, 0], [1, 0], [1, -1], [0, 2], [1, 2]],
  "1>2": [[0, 0], [1, 0], [1, -1], [0, 2], [1, 2]],
  "2>1": [[0, 0], [-1, 0], [-1, 1], [0, -2], [-1, -2]],
  "2>3": [[0, 0], [1, 0], [1, 1], [0, -2], [1, -2]],
  "3>2": [[0, 0], [-1, 0], [-1, -1], [0, 2], [-1, 2]],
  "3>0": [[0, 0], [-1, 0], [-1, -1], [0, 2], [-1, 2]],
  "0>3": [[0, 0], [1, 0], [1, 1], [0, -2], [1, -2]],
};

// prettier-ignore
const I_KICKS: Partial<Record<Transition, readonly Kick[]>> = {
  "0>1": [[0, 0], [-2, 0], [1, 0], [-2, -1], [1, 2]],
  "1>0": [[0, 0], [2, 0], [-1, 0], [2, 1], [-1, -2]],
  "1>2": [[0, 0], [-1, 0], [2, 0], [-1, 2], [2, -1]],
  "2>1": [[0, 0], [1, 0], [-2, 0], [1, -2], [-2, 1]],
  "2>3": [[0, 0], [2, 0], [-1, 0], [2, 1], [-1, -2]],
  "3>2": [[0, 0], [-2, 0], [1, 0], [-2, -1], [1, 2]],
  "3>0": [[0, 0], [1, 0], [-2, 0], [1, -2], [-2, 1]],
  "0>3": [[0, 0], [-1, 0], [2, 0], [-1, 2], [2, -1]],
};

function toBoardKicks(kicks: readonly Kick[] | undefined): readonly Kick[] {
  return (kicks ?? [[0, 0]]).map(([dx, dy]) => [dx, -dy] as const);
}

/**
 * Obraca klocek o 90° (1 = w prawo, -1 = w lewo), próbując kolejnych kicków.
 * Zwraca `null`, gdy żadna pozycja nie pasuje albo klocek to O.
 */
export function rotate(board: Board, piece: Piece, direction: 1 | -1): Piece | null {
  if (piece.type === "O") return null;

  const to = ((piece.rotation + direction + 4) % 4) as Rotation;
  const table = piece.type === "I" ? I_KICKS : JLSTZ_KICKS;

  for (const [dx, dy] of toBoardKicks(table[`${piece.rotation}>${to}`])) {
    const candidate: Piece = { ...piece, rotation: to, x: piece.x + dx, y: piece.y + dy };
    if (!collides(board, candidate)) return candidate;
  }
  return null;
}
