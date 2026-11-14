import { PIECE_TYPES, type PieceType } from "./pieces";

/**
 * Krok PRNG mulberry32. Stan to liczba 32-bitowa przechowywana w stanie gry,
 * więc ta sama sekwencja wywołań zawsze daje te same wyniki.
 */
export function nextRandom(state: number): { value: number; state: number } {
  const next = (state + 0x6d2b79f5) | 0;
  let t = next;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return { value: ((t ^ (t >>> 14)) >>> 0) / 4294967296, state: next };
}

/** Losuje „worek” z wszystkimi 7 klockami w losowej kolejności (Fisher–Yates). */
export function generateBag(rng: number): { bag: PieceType[]; rng: number } {
  const bag = [...PIECE_TYPES];
  let state = rng;
  for (let i = bag.length - 1; i > 0; i--) {
    const step = nextRandom(state);
    state = step.state;
    const j = Math.floor(step.value * (i + 1));
    [bag[i], bag[j]] = [bag[j]!, bag[i]!];
  }
  return { bag, rng: state };
}
