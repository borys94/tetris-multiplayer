import { TICKS_PER_SECOND } from "./time";

const LINE_CLEAR_SCORES = [0, 100, 300, 500, 800] as const;

export const SOFT_DROP_POINTS = 1;
export const HARD_DROP_POINTS = 2;
export const LINES_PER_LEVEL = 10;

export function lineClearScore(lines: number, level: number): number {
  return (LINE_CLEAR_SCORES[lines as 0 | 1 | 2 | 3 | 4] ?? 0) * level;
}

export function levelForLines(lines: number): number {
  return 1 + Math.floor(lines / LINES_PER_LEVEL);
}

/** Liczba ticków na spadek o jeden wiersz; maleje z poziomem, minimum 1. */
export function gravityTicks(level: number): number {
  const secondsPerRow = (0.8 - (level - 1) * 0.007) ** (level - 1);
  return Math.max(1, Math.round(secondsPerRow * TICKS_PER_SECOND));
}
