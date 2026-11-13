/**
 * Board contract. Geometry rules (hidden rows, spawn area) are defined in lesson 07.
 * See specs/006-game-domain-model/design.md D-006.
 */
import type { PieceKind } from './piece.js';

/** A locked block of the given kind, or `null` for an empty cell. */
export type Cell = PieceKind | null;

export type BoardRow = readonly Cell[];

export interface Board {
  readonly width: number;
  readonly height: number;
  /** Rows from top to bottom: `rows[y][x]`. */
  readonly rows: readonly BoardRow[];
}
