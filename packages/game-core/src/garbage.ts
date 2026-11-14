import { BOARD_WIDTH, type Board, type Cell } from "./board";
import { nextRandom } from "./random";

/** Paczka linii śmieci z dziurą w tej samej kolumnie (spec 007). */
export interface GarbageBatch {
  readonly lines: number;
  readonly hole: number;
}

/** Komórka linii śmieci. */
export const GARBAGE_CELL = "G";

/** Ile linii śmieci wysyła wyczyszczenie 0–4 linii naraz. */
const ATTACK = [0, 0, 1, 2, 4] as const;

export function attackLines(cleared: number): number {
  return ATTACK[cleared as 0 | 1 | 2 | 3 | 4] ?? 0;
}

export function garbageLines(queue: readonly GarbageBatch[]): number {
  return queue.reduce((sum, batch) => sum + batch.lines, 0);
}

/**
 * Kasuje do `lines` linii z początku kolejki.
 * Zwraca kolejkę po kasowaniu i liczbę linii, które zostały do wysłania przeciwnikowi.
 */
export function cancelGarbage(
  queue: readonly GarbageBatch[],
  lines: number,
): { queue: readonly GarbageBatch[]; remaining: number } {
  let remaining = lines;
  const rest = [...queue];
  while (remaining > 0 && rest[0]) {
    const first = rest[0];
    const used = Math.min(first.lines, remaining);
    remaining -= used;
    if (used === first.lines) rest.shift();
    else rest[0] = { ...first, lines: first.lines - used };
  }
  return { queue: rest, remaining };
}

/**
 * Wstawia całą kolejkę na dół planszy, przesuwając ją w górę.
 * `toppedOut` jest prawdą, gdy przesunięcie wypchnęło zajęte komórki poza planszę.
 */
export function insertGarbage(
  board: Board,
  queue: readonly GarbageBatch[],
): { board: Board; toppedOut: boolean } {
  const rows = queue.flatMap((batch) =>
    Array.from({ length: batch.lines }, () =>
      Array.from({ length: BOARD_WIDTH }, (_, x): Cell => (x === batch.hole ? null : GARBAGE_CELL)),
    ),
  );
  if (rows.length === 0) return { board, toppedOut: false };

  const shift = Math.min(rows.length, board.length);
  const toppedOut = board.slice(0, shift).some((row) => row.some((cell) => cell !== null));
  return { board: [...board.slice(shift), ...rows.slice(rows.length - shift)], toppedOut };
}

/** Losuje kolumnę dziury dla nowej paczki z RNG pokoju (ten sam PRNG co worek klocków). */
export function randomHole(rng: number): { hole: number; rng: number } {
  const step = nextRandom(rng);
  return { hole: Math.floor(step.value * BOARD_WIDTH), rng: step.state };
}
