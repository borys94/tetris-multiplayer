import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router'
import { BoardCanvas } from '../../board/BoardCanvas'
import styles from '../../board/board.module.scss'
import { PiecePreview } from '../../board/PiecePreview'
import { useDrawOn, useGameLoop, useWindowKeys } from '../../board/use-game-loop'
import { CONNECTION_ERRORS, STATUS_LABELS } from '../../core/net/labels'
import { PATHS } from '../../core/routes'
import { drawBoard } from '../../core/play/render'
import { useServer, useServerMessages } from '../../hooks/server'
import { useStore } from '../../hooks/store'
import { Button } from '../../ui'
import { SoloSession } from './model/solo-session'

interface SoloGameProps {
  /** Widok gry jest widoczny; po przejściu do innego widoku gra się wstrzymuje. */
  active?: boolean
  /** Gość: wynik nie trafia do rankingu, więc po grze proponujemy konto (spec solo, R4). */
  guest?: boolean
}

/** Widok gry singleplayer; stan i reguły gry są w `SoloSession` (ADR-0006). */
export const SoloGame = ({ active = true, guest = false }: SoloGameProps) => {
  const { status, send } = useServer()
  const [session] = useState(() => new SoloSession(send))
  const { screen, error, hud, result } = useStore(session)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useDrawOn(session.boardChanged.watch, () => {
    const ctx = canvasRef.current?.getContext('2d')
    if (ctx && session.board) {
      drawBoard(ctx, session.board)
    }
  })
  useServerMessages((msg) => session.receive(msg))
  useEffect(() => session.connectionChanged(status), [session, status])

  // Pętla gry działa tylko na ekranie "playing"; każda zmiana ekranu odświeża planszę.
  useEffect(() => session.refresh(), [session, screen])
  useGameLoop(
    screen === 'playing',
    () => session.tick(),
    () => session.refresh(),
  )

  // Przejście do innego widoku wstrzymuje grę, tak jak utrata fokusu.
  useEffect(() => {
    if (!active) {
      return
    }
    return () => session.leave()
  }, [active, session])

  useWindowKeys(active, {
    onKeyDown: (event) => {
      if (session.keyDown(event.code, event.repeat)) {
        event.preventDefault()
      }
    },
    onKeyUp: (event) => session.input.keyUp(event.code),
    onBlur: () => session.leave(),
  })

  const { play, newGame } = session
  const online = status === 'online'

  return (
    <div className={styles.game}>
      <aside className={styles.panel}>
        <h2>Hold</h2>
        <PiecePreview type={hud.hold} label="Hold" />
      </aside>

      <div className={styles.board}>
        <BoardCanvas ref={canvasRef} label="Plansza" />
        {screen !== 'playing' && (
          <div className={styles.overlay}>
            {screen === 'loading' && <p>{STATUS_LABELS[status]}</p>}
            {screen === 'ready' && (
              <>
                <p>Naciśnij Enter, aby zacząć</p>
                <Button size="large" onClick={play} disabled={!online}>
                  Start
                </Button>
              </>
            )}
            {screen === 'paused' && (
              <>
                <p>Pauza</p>
                {!online && <p className={styles.finalScore}>{STATUS_LABELS[status]}</p>}
                <Button size="large" onClick={play} disabled={!online}>
                  Wznów
                </Button>
                <Button size="large" onClick={newGame} disabled={!online}>
                  Restart
                </Button>
              </>
            )}
            {screen === 'over' && (
              <>
                <p>Koniec gry</p>
                <p className={styles.finalScore} data-testid="final-score">
                  Wynik: {result?.score ?? hud.score}
                </p>
                {guest && (
                  <p className={styles.hint}>
                    <Link to={PATHS.account}>Załóż konto</Link>, aby zapisywać wyniki w rankingu
                  </p>
                )}
                <Button size="large" onClick={newGame} disabled={!online}>
                  Zagraj ponownie
                </Button>
              </>
            )}
          </div>
        )}
      </div>

      <aside className={styles.panel}>
        <h2>Następne</h2>
        {hud.next.map((type, index) => (
          <PiecePreview key={index} type={type} label={`Następny ${index + 1}`} />
        ))}
        <dl className={styles.stats}>
          <dt>Wynik</dt>
          <dd data-testid="score">{hud.score}</dd>
          <dt>Poziom</dt>
          <dd data-testid="level">{hud.level}</dd>
          <dt>Linie</dt>
          <dd data-testid="lines">{hud.lines}</dd>
        </dl>
        <p className={styles.status} data-status={status} role="status">
          {(error && CONNECTION_ERRORS[error]) ?? STATUS_LABELS[status]}
        </p>
      </aside>
    </div>
  )
}
