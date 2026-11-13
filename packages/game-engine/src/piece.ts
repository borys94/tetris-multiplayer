/**
 * Tetromino identifiers and the active piece contract.
 * Shapes, spawn rules and the meaning of `position` are defined in lesson 07; SRS in lesson 09.
 * See specs/006-game-domain-model/design.md D-007.
 */

export type PieceKind = 'I' | 'J' | 'L' | 'O' | 'S' | 'T' | 'Z';

/** Quarter turns clockwise from the spawn orientation. */
export type Rotation = 0 | 1 | 2 | 3;

export interface Position {
  readonly x: number;
  readonly y: number;
}

/** Occupied cells are derived from `kind` and `rotation`; they are not stored. */
export interface ActivePiece {
  readonly kind: PieceKind;
  readonly rotation: Rotation;
  readonly position: Position;
}
