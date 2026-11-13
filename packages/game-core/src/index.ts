export const BOARD_WIDTH = 10;
export const BOARD_HEIGHT = 20;

export type Cell = 0 | 1;
export type Board = Cell[][];

export function createEmptyBoard(): Board {
  return Array.from({ length: BOARD_HEIGHT }, () =>
    Array.from({ length: BOARD_WIDTH }, () => 0 as const),
  );
}
