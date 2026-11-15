import { TICKS_PER_SECOND } from '@tetris/game-core'

const TICK_MS = 1000 / TICKS_PER_SECOND
/** Limit nadrabiania ticków po przycięciu pętli zdarzeń, żeby nie przewinąć gier. */
export const MAX_CATCH_UP_TICKS = 30

/**
 * Pętla czasu rzeczywistego 60 ticków/s: co pół ticka liczy, ile pełnych ticków minęło,
 * i przekazuje je do `advance` (najwyżej `MAX_CATCH_UP_TICKS`, nadmiar do `onDropped`).
 * Zwraca funkcję, która ją zatrzymuje.
 */
export const startTickLoop = (
  now: () => number,
  advance: (ticks: number) => void,
  onDropped: (ticks: number) => void = () => {},
): (() => void) => {
  let last = now()
  let accumulator = 0
  const loop = setInterval(() => {
    const current = now()
    accumulator += current - last
    last = current
    const ticks = Math.floor(accumulator / TICK_MS)
    accumulator -= ticks * TICK_MS
    if (ticks > MAX_CATCH_UP_TICKS) {
      onDropped(ticks - MAX_CATCH_UP_TICKS)
    }
    advance(Math.min(ticks, MAX_CATCH_UP_TICKS))
  }, TICK_MS / 2)
  return () => clearInterval(loop)
}
