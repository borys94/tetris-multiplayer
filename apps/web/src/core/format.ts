import { TICKS_PER_SECOND } from '@tetris/game-core'
import type { MatchEndReason } from '@tetris/protocol'

/** Data i godzina w formacie polskim. */
export const formatDate = (iso: string): string => {
  return new Date(iso).toLocaleString('pl-PL', { dateStyle: 'short', timeStyle: 'short' })
}

/** Czas w sekundach jako „m:ss”. */
export const formatClock = (totalSeconds: number): string => {
  return `${Math.floor(totalSeconds / 60)}:${String(totalSeconds % 60).padStart(2, '0')}`
}

/** Czas meczu z ticków jako „m:ss”. */
export const formatDuration = (ticks: number): string => {
  return formatClock(Math.floor(ticks / TICKS_PER_SECOND))
}

export const MATCH_END_LABELS: Readonly<Record<MatchEndReason, string>> = {
  topout: 'przepełnienie planszy',
  left: 'wyjście z meczu',
  timeout: 'brak powrotu po rozłączeniu',
}
