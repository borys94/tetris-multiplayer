import { TICKS_PER_SECOND } from "@tetris/game-core";

export const TICK_MS = 1000 / TICKS_PER_SECOND;
/** Limit nadrabiania po długiej przerwie (np. karta w tle), żeby nie przewinąć gry. */
const MAX_FRAME_MS = 250;

/**
 * Pętla ze stałym krokiem: `onTick` wywołujemy dokładnie 60 razy na sekundę gry,
 * niezależnie od FPS, a `onFrame` raz na klatkę do rysowania.
 * Zwraca funkcję zatrzymującą pętlę.
 */
export function startLoop(onTick: () => void, onFrame: () => void): () => void {
  let last = performance.now();
  let accumulator = 0;
  let frameId = 0;

  const frame = (now: number) => {
    accumulator += Math.min(now - last, MAX_FRAME_MS);
    last = now;
    while (accumulator >= TICK_MS) {
      onTick();
      accumulator -= TICK_MS;
    }
    onFrame();
    frameId = requestAnimationFrame(frame);
  };

  frameId = requestAnimationFrame(frame);
  return () => cancelAnimationFrame(frameId);
}
