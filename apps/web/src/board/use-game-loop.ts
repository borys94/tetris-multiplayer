import { useEffect, useLayoutEffect, useRef } from 'react'
import { startLoop } from '../core/play/loop'

/** Pętla gry (60 ticków/s, `onTick`) z rysowaniem co klatkę (`onFrame`), póki `running`. */
export const useGameLoop = (running: boolean, onTick: () => void, onFrame: () => void): void => {
  const latest = useRef({ onTick, onFrame })
  useLayoutEffect(() => {
    latest.current = { onTick, onFrame }
  })
  useEffect(() => {
    if (!running) {
      return
    }
    return startLoop(
      () => latest.current.onTick(),
      () => latest.current.onFrame(),
    )
  }, [running])
}

export interface KeyHandlers {
  onKeyDown(event: KeyboardEvent): void
  onKeyUp(event: KeyboardEvent): void
  onBlur(): void
}

/** Klawiatura i utrata fokusu okna, póki `enabled`; zawsze z najnowszymi handlerami. */
export const useWindowKeys = (enabled: boolean, handlers: KeyHandlers): void => {
  const latest = useRef(handlers)
  useLayoutEffect(() => {
    latest.current = handlers
  })
  useEffect(() => {
    if (!enabled) {
      return
    }
    const onKeyDown = (event: KeyboardEvent) => latest.current.onKeyDown(event)
    const onKeyUp = (event: KeyboardEvent) => latest.current.onKeyUp(event)
    const onBlur = () => latest.current.onBlur()
    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)
    window.addEventListener('blur', onBlur)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
      window.removeEventListener('blur', onBlur)
    }
  }, [enabled])
}

/** Rysuje po płótnie przy każdym sygnale zmiany planszy (`watch` z `state/`). */
export const useDrawOn = (watch: (listener: () => void) => () => void, draw: () => void): void => {
  const latest = useRef(draw)
  useLayoutEffect(() => {
    latest.current = draw
  })
  useEffect(() => watch(() => latest.current()), [watch])
}
