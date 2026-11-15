import type { Ref } from 'react'
import { BOARD_PIXEL_HEIGHT, BOARD_PIXEL_WIDTH } from '../core/play/render'

/** Płótno planszy w rozmiarze z `play/render`; rysuje po nim właściciel przez `ref`. */
export const BoardCanvas = ({ ref, label }: { ref: Ref<HTMLCanvasElement>; label: string }) => {
  return (
    <canvas
      ref={ref}
      width={BOARD_PIXEL_WIDTH}
      height={BOARD_PIXEL_HEIGHT}
      role="img"
      aria-label={label}
    />
  )
}
