import { previewQueue, type GameState, type PieceType } from '@tetris/game-core'
import type { ErrorCode, ServerMessage } from '@tetris/protocol'
import type { ConnectionStatus } from '../../../core/net/connection'
import type { Send } from '../../../core/net/game-server'
import { sameHud } from '../../../core/play/hud'
import { InputController } from '../../../core/play/input'
import { Predictor } from '../../../core/play/predictor'
import { Signal, Store } from '../../../core/store'

export type SoloScreen = 'loading' | 'ready' | 'playing' | 'paused' | 'over'

export interface SoloHud {
  score: number
  lines: number
  level: number
  hold: PieceType | null
  next: readonly PieceType[]
}

export interface SoloResult {
  score: number
  lines: number
  level: number
}

export interface SoloState {
  screen: SoloScreen
  /** Ostatni błąd serwera gry (np. `server_full`); `welcome` go czyści. */
  error: ErrorCode | null
  hud: SoloHud
  result: SoloResult | null
}

const EMPTY_HUD: SoloHud = { score: 0, lines: 0, level: 1, hold: null, next: [] }

const hudOf = (state: GameState): SoloHud => {
  return {
    score: state.score,
    lines: state.lines,
    level: state.level,
    hold: state.hold,
    next: previewQueue(state),
  }
}

/**
 * Gra singleplayer liczona przez serwer (ADR-0006): ekrany gry, akcje gracza przewidywane
 * lokalnie i wysyłane do serwera, uzgadnianie ze snapshotami. Wynik końcowy pochodzi
 * z wiadomości `over`. Rysowanie i pętlę klatek zapewnia widok.
 */
export class SoloSession extends Store<SoloState> {
  readonly input = new InputController()
  /** Plansza do narysowania się zmieniła. */
  readonly boardChanged = new Signal()
  private predictor: Predictor | null = null
  /** Po `newGame` wznawiamy grę od razu, gdy serwer przyśle jej stan. */
  private startOnGame = false

  constructor(private readonly send: Send) {
    super({ screen: 'loading', error: null, hud: EMPTY_HUD, result: null })
  }

  /** Przewidywany stan gry do narysowania. */
  get board(): GameState | null {
    return this.predictor?.state ?? null
  }

  private get screen(): SoloScreen {
    return this.getState().screen
  }

  play = (): void => {
    if (this.send({ type: 'resume' })) {
      this.setState({ screen: 'playing' })
    }
  }

  pause = (): void => {
    this.input.reset()
    if (this.predictor) {
      this.send({ type: 'pause', tick: this.predictor.tick })
    }
    this.setState({ screen: 'paused' })
  }

  newGame = (): void => {
    this.startOnGame = true
    if (!this.send({ type: 'newGame' })) {
      this.startOnGame = false
      return
    }
    this.input.reset()
    this.setState({ result: null, ...(this.screen !== 'playing' ? { screen: 'loading' } : {}) })
  }

  /** Gracz zostawia grę (inny widok, utrata fokusu): trwająca gra się wstrzymuje. */
  leave(): void {
    if (this.screen === 'playing') {
      this.pause()
    }
  }

  /** Klawisz z okna; zwraca `true`, gdy trzeba zablokować domyślną akcję strony. */
  keyDown(code: string, repeat: boolean): boolean {
    if (code === 'KeyP') {
      if (this.screen === 'playing') {
        this.pause()
      } else if (this.screen === 'paused') {
        this.play()
      }
      return false
    }
    if (code === 'Enter') {
      if (this.screen === 'ready') {
        this.play()
      } else if (this.screen === 'over') {
        this.newGame()
      }
      return false
    }
    return this.screen === 'playing' && this.input.press(code, repeat)
  }

  /** Serwer wstrzymuje sesję po zerwaniu połączenia; klient robi to samo lokalnie. */
  connectionChanged(status: ConnectionStatus): void {
    if (status !== 'online' && this.screen === 'playing') {
      this.input.reset()
      this.setState({ screen: 'paused' })
    }
  }

  /** Jeden tick klienta: akcje z klawiatury do predyktora i, jeśli były, do serwera. */
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

  /** Plansza i HUD po zmianie stanu gry (co klatkę i po wiadomościach serwera). */
  refresh(): void {
    if (!this.predictor) {
      return
    }
    this.boardChanged.emit()
    const next = hudOf(this.predictor.state)
    if (!sameHud(this.getState().hud, next)) {
      this.setState({ hud: next })
    }
  }

  receive(msg: ServerMessage): void {
    switch (msg.type) {
      case 'game': {
        this.predictor = new Predictor(msg.state, msg.tick)
        this.refresh()
        if (msg.state.status === 'over') {
          const { score, lines, level } = msg.state
          this.setState({ result: { score, lines, level }, screen: 'over' })
        } else if (this.startOnGame) {
          this.startOnGame = false
          this.play()
        } else {
          // Nierozpoczęta gra zostaje na ekranie startu; wznowiona po rozłączeniu jest wstrzymana.
          const notStarted = this.screen === 'loading' || this.screen === 'ready'
          this.setState({ screen: notStarted && msg.tick === 0 ? 'ready' : 'paused' })
        }
        break
      }
      case 'snapshot': {
        const predictor = this.predictor
        if (!predictor) {
          break
        }
        if (this.screen === 'playing') {
          predictor.reconcile(msg.tick, msg.ackSeq, msg.state)
        } else if (this.screen === 'paused') {
          predictor.adopt(msg.state, msg.tick)
        } else {
          break
        }
        this.refresh()
        break
      }
      case 'over':
        this.setState({
          result: { score: msg.score, lines: msg.lines, level: msg.level },
          screen: 'over',
        })
        break
      case 'error':
        this.setState({ error: msg.code })
        break
      case 'welcome':
        this.setState({ error: null })
        break
    }
  }
}
