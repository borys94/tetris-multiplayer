import { useMatches } from 'react-router'
import type { View } from '../core/routes'

/** Uchwyt trasy (`handle`) z widokiem, który pokazuje (trasy w `App`). */
export interface ViewHandle {
  view: View
}

/** Widok bieżącej trasy; nieznane ścieżki przekierowuje `App`, więc domyślnie gra. */
export const useView = (): View => {
  const handle = useMatches().findLast((match) => match.handle)?.handle as ViewHandle | undefined
  return handle?.view ?? 'game'
}
