import { garbageLines, previewQueue, type GameState, type PieceType } from '@tetris/game-core'
import { COUNTDOWN_MS, type OpponentView, type ServerMessage } from '@tetris/protocol'
import type { Send } from '../../../core/net/game-server'
import { sameHud } from '../../../core/play/hud'
import { InputController } from '../../../core/play/input'
import { Predictor } from '../../../core/play/predictor'
import type { ResultMessage } from './messages'
import { Signal, Store } from '../../../core/store'

export type MatchPhase = 'idle' | 'playing' | 'over'

export interface MatchHud {
  score: number
  lines: number
  linesSent: number
  garbage: number
  hold: PieceType | null
  next: readonly PieceType[]
  opponentScore: number
  opponentSent: number
}

export interface MatchState {
  phase: MatchPhase
  result: ResultMessage | null
  hud: MatchHud
}

const EMPTY_HUD: MatchHud = {
  score: 0,
  lines: 0,
  linesSent: 0,
  garbage: 0,
  hold: null,
  next: [],
  opponentScore: 0,
  opponentSent: 0,
}

const COUNTDOWN_SECONDS = COUNTDOWN_MS / 1000

/**
 * Sekundy do startu meczu. Zegar klienta może zostać w tyle za serwerem, więc nie
 * pokazujemy więcej niż długość odliczania.
 */
export const countdownSeconds = (startsAt: number, now: number): number => {
  return Math.min(COUNTDOWN_SECONDS, Math.max(0, Math.ceil((startsAt - now) / 1000)))
}

/**
 * Mecz 1v1 (spec versus-1v1): własna plansza przewidywana lokalnie jak w singleplayerze
 * (ADR-0006), bez pauzy, i plansza przeciwnika ze snapshotów serwera.
 */
export class MatchSession extends Store<MatchState> {
  readonly input = new InputController()
  /** Plansze do narysowania się zmieniły. */
  readonly boardChanged = new Signal()
  private predictor: Predictor | null = null
  private opponentView: OpponentView | null = null

  constructor(private readonly send: Send) {
    super({ phase: 'idle', result: null, hud: EMPTY_HUD })
  }

  get board(): GameState | null {
    return this.predictor?.state ?? null
  }

  get opponent(): OpponentView | null {
    return this.opponentView
  }

  /** Klawisz z okna w trakcie meczu; `true`, gdy trzeba zablokować domyślną akcję strony. */
  keyDown(code: string, repeat: boolean): boolean {
    return this.input.press(code, repeat)
  }

  /** Mecz nie ma pauzy: utrata fokusu tylko puszcza wciśnięte klawisze. */
  blur(): void {
    this.input.reset()
  }

  tick(): void {
    const record = this.predictor?.step(this.input.update())
    if (record) {
      this.send({
        type: 'input',
        seq: record.seq,
        tick: record.tick,
        actions: [...record.actions],
      })
    }
  }

  refresh(): void {
    this.boardChanged.emit()
    const state = this.predictor?.state
    if (!state) {
      return
    }
    const opponent = this.opponentView
    const next: MatchHud = {
      score: state.score,
      lines: state.lines,
      linesSent: state.linesSent,
      garbage: garbageLines(state.garbage),
      hold: state.hold,
      next: previewQueue(state),
      opponentScore: opponent?.score ?? 0,
      opponentSent: opponent?.linesSent ?? 0,
    }
    if (!sameHud(this.getState().hud, next)) {
      this.setState({ hud: next })
    }
  }

  receive(msg: ServerMessage): void {
    switch (msg.type) {
      case 'match':
        this.predictor = new Predictor(msg.state, msg.tick)
        this.opponentView = msg.opponent
        this.input.reset()
        this.setState({ result: null, phase: 'playing' })
        this.refresh()
        break
      case 'matchSnapshot': {
        const predictor = this.predictor
        if (!predictor) {
          break
        }
        if (this.getState().phase === 'playing') {
          predictor.reconcile(msg.tick, msg.ackSeq, msg.state)
        } else {
          predictor.adopt(msg.state, msg.tick)
        }
        this.opponentView = msg.opponent
        this.refresh()
        break
      }
      case 'result':
        this.input.reset()
        this.setState({ result: msg, phase: 'over' })
        break
      case 'roomClosed':
        this.predictor = null
        this.opponentView = null
        this.setState({ phase: 'idle', result: null })
        break
      case 'error':
        if (msg.code === 'session_expired') {
          this.setState({ phase: 'idle' })
        }
        break
    }
  }
}
