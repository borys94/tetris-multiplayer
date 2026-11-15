import { useEffect, useRef, useState } from 'react'
import { BoardCanvas } from '../../../board/BoardCanvas'
import gameStyles from '../../../board/board.module.scss'
import { PiecePreview } from '../../../board/PiecePreview'
import { useDrawOn, useGameLoop, useWindowKeys } from '../../../board/use-game-loop'
import { MATCH_END_LABELS } from '../../../core/format'
import { drawBoard } from '../../../core/play/render'
import { useServer, useServerMessages } from '../../../hooks/server'
import { useStore } from '../../../hooks/store'
import { Button } from '../../../ui'
import { countdownSeconds, MatchSession } from '../model/match-session'
import type { ResultMessage as Result, RoomMessage } from '../model/messages'
import styles from './Match.module.scss'

/** Opis końca meczu z punktu widzenia gracza. */
export const resultText = (result: Result): string => {
  if (result.won) {
    return {
      topout: 'Plansza przeciwnika się przepełniła',
      left: 'Przeciwnik wyszedł z meczu',
      timeout: 'Przeciwnik nie wrócił po rozłączeniu',
    }[result.reason]
  }
  return `Przegrana: ${MATCH_END_LABELS[result.reason]}`
}

/** Sekundy odliczania, odświeżane kilka razy na sekundę; `null` poza odliczaniem. */
const useCountdown = (startsAt: number | undefined): number | null => {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    if (startsAt === undefined) {
      return
    }
    const update = () => setNow(Date.now())
    // Komponent żyje od wejścia na stronę: odświeżamy czas od razu, a nie po pierwszym interwale.
    const first = window.setTimeout(update, 0)
    const timer = window.setInterval(update, 200)
    return () => {
      window.clearTimeout(first)
      window.clearInterval(timer)
    }
  }, [startsAt])
  return startsAt === undefined ? null : countdownSeconds(startsAt, now)
}

interface MatchProps {
  /** Widok 1v1 jest widoczny: tylko wtedy przechwytujemy klawisze. */
  active: boolean
  room: RoomMessage | null
  onReady: () => void
  onLeave: () => void
}

/**
 * Widok meczu 1v1: dwie plansze, kolejka śmieci, wynik i rewanż; stan meczu jest
 * w `MatchSession`. Komponent jest zawsze zamontowany, bo `match` przychodzi zaraz po `room`.
 */
export const Match = ({ active, room, onReady, onLeave }: MatchProps) => {
  const { send } = useServer()
  const [session] = useState(() => new MatchSession(send))
  const { phase, result, hud } = useStore(session)
  const ownCanvas = useRef<HTMLCanvasElement>(null)
  const opponentCanvas = useRef<HTMLCanvasElement>(null)
  const countdown = useCountdown(room?.state === 'countdown' ? room.startsAt : undefined)

  useDrawOn(session.boardChanged.watch, () => {
    const own = ownCanvas.current?.getContext('2d')
    const other = opponentCanvas.current?.getContext('2d')
    if (session.board && own) {
      drawBoard(own, session.board)
    }
    if (session.opponent && other) {
      drawBoard(other, session.opponent)
    }
  })
  useServerMessages((msg) => session.receive(msg))

  // Pętla przewidywania działa przez cały mecz, także gdy gracz zajrzy do innego widoku.
  useEffect(() => session.refresh(), [session, phase])
  useGameLoop(
    phase === 'playing',
    () => session.tick(),
    () => session.refresh(),
  )

  useWindowKeys(active && phase === 'playing', {
    onKeyDown: (event) => {
      if (session.keyDown(event.code, event.repeat)) {
        event.preventDefault()
      }
    },
    onKeyUp: (event) => session.input.keyUp(event.code),
    onBlur: () => session.blur(),
  })

  if (!room || (phase === 'idle' && room.state !== 'countdown')) {
    return null
  }

  const me = room.players[room.you]
  const opponent = room.players.find((_, index) => index !== room.you)
  const canRematch = room.state === 'finished' && room.players.length === 2
  const garbageHeight = `${Math.min(100, (hud.garbage / 20) * 100)}%`

  return (
    <div className={styles.match}>
      <div className={gameStyles.panel}>
        <h2>Hold</h2>
        <PiecePreview type={hud.hold} label="Hold" />
        <h2>Następne</h2>
        {hud.next.map((type, index) => (
          <PiecePreview key={index} type={type} label={`Następny ${index + 1}`} />
        ))}
      </div>

      <figure className={styles.player}>
        <figcaption>{me?.name ?? 'Ty'}</figcaption>
        <div className={styles.boardRow}>
          <div
            className={styles.garbage}
            role="meter"
            aria-label="Nadchodzące śmieci"
            aria-valuemin={0}
            aria-valuemax={20}
            aria-valuenow={hud.garbage}
          >
            <span style={{ height: garbageHeight }} />
          </div>
          <div className={gameStyles.board}>
            <BoardCanvas ref={ownCanvas} label="Twoja plansza" />
            {room.state === 'countdown' && countdown !== null && (
              <div className={gameStyles.overlay}>
                <p className={styles.countdown} data-testid="countdown">
                  {countdown}
                </p>
              </div>
            )}
            {phase === 'over' && result && (
              <div className={gameStyles.overlay}>
                <p>{result.won ? 'Wygrana!' : 'Przegrana'}</p>
                <p className={gameStyles.finalScore}>{resultText(result)}</p>
                {canRematch && (
                  <Button size="large" onClick={onReady} disabled={me?.ready ?? false}>
                    {me?.ready ? 'Czekamy na przeciwnika…' : 'Rewanż'}
                  </Button>
                )}
                <Button size="large" onClick={onLeave}>
                  Wyjdź z pokoju
                </Button>
              </div>
            )}
          </div>
        </div>
        <dl className={gameStyles.stats}>
          <dt>Wynik</dt>
          <dd data-testid="score">{hud.score}</dd>
          <dt>Linie</dt>
          <dd>{hud.lines}</dd>
          <dt>Wysłane</dt>
          <dd data-testid="lines-sent">{hud.linesSent}</dd>
        </dl>
      </figure>

      <figure className={styles.player}>
        <figcaption>
          {opponent?.name ?? 'Przeciwnik'}
          {opponent && !opponent.connected && ' (rozłączony)'}
        </figcaption>
        <div className={gameStyles.board}>
          <BoardCanvas ref={opponentCanvas} label="Plansza przeciwnika" />
        </div>
        <dl className={gameStyles.stats}>
          <dt>Wynik</dt>
          <dd>{hud.opponentScore}</dd>
          <dt>Wysłane</dt>
          <dd>{hud.opponentSent}</dd>
        </dl>
      </figure>
    </div>
  )
}
