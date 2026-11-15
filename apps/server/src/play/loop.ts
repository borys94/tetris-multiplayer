import type { SessionStore } from '../game/session-store'
import { roomTickDuration, tickDuration, ticksDropped } from '../observability/metrics'
import type { RoomStore } from '../rooms/room-store'
import { startTickLoop } from './tick-loop'

export interface GameLoopOptions {
  sessions: SessionStore
  /** Pokoje 1v1 (spec versus-1v1), liczone w tym samym obiegu co sesje. */
  rooms?: RoomStore
  now?: () => number
  /** Co ile ms usuwamy sesje, które za długo czekają na wznowienie. */
  sweepMs?: number
}

/**
 * Jedna pętla czasu rzeczywistego dla sesji i pokoi: `blockfall_tick_duration_seconds`
 * i alert wolnego ticka obejmują całą grę, a `blockfall_room_tick_seconds` jej część
 * przypadającą na pokoje. Zwraca funkcję, która zatrzymuje pętlę.
 */
export const startGameLoop = ({
  sessions,
  rooms,
  now = () => performance.now(),
  sweepMs = 1000,
}: GameLoopOptions): (() => void) => {
  const stopLoop = startTickLoop(
    now,
    (ticks) => {
      const stopTimer = tickDuration.startTimer()
      sessions.advance(ticks)
      if (rooms) {
        const stopRoomTimer = roomTickDuration.startTimer()
        rooms.advance(ticks)
        stopRoomTimer()
      }
      stopTimer()
    },
    (dropped) => ticksDropped.inc(dropped),
  )
  const sweep = setInterval(() => sessions.expire(), sweepMs)
  return () => {
    stopLoop()
    clearInterval(sweep)
  }
}
