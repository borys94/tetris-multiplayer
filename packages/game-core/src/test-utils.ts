import { BOARD_WIDTH, TOTAL_ROWS, type Board, type Cell } from "./board";

/**
 * Buduje planszę z wierszy tekstu wyrównanych do dołu planszy.
 * `#` to zajęta komórka, `.` to pusta.
 */
export function boardFromRows(rows: readonly string[]): Board {
  const empty = Array.from({ length: TOTAL_ROWS - rows.length }, () =>
    Array.from({ length: BOARD_WIDTH }, (): Cell => null),
  );
  const filled = rows.map((row) => [...row].map((char): Cell => (char === "#" ? "Z" : null)));
  return [...empty, ...filled];
}

/** Plansza wypełniona w całości z wyjątkiem podanych komórek. */
export function boardFilledExcept(holes: readonly { x: number; y: number }[]): Board {
  return Array.from({ length: TOTAL_ROWS }, (_, y) =>
    Array.from({ length: BOARD_WIDTH }, (_, x): Cell =>
      holes.some((hole) => hole.x === x && hole.y === y) ? null : "Z",
    ),
  );
}
