import { applyAction, tick, type Action, type GameState } from '@tetris/game-core'

interface PendingInput {
  seq: number
  /** Tick, na którym serwer zastosuje akcje (nie wcześniej niż bieżący tick symulacji). */
  tick: number
  actions: readonly Action[]
}

/**
 * Gra jednego gracza z buforem wejścia (ADR-0006): akcja klienta z tickiem `t`
 * trafia dokładnie na `t`, jeśli dotrze przed nim, a później na bieżący tick symulacji.
 * Zegar i jego granice trzyma właściciel (sesja singleplayer albo pokój).
 */
export class BufferedGame {
  simTick = 0
  /** Ostatnia zastosowana akcja klienta. */
  ackSeq = 0
  private lastSeq = 0
  private lastInputTick = 0
  private pending: PendingInput[] = []

  constructor(public game: GameState) {}

  get over(): boolean {
    return this.game.status === 'over'
  }

  reset(game: GameState): void {
    this.game = game
    this.simTick = 0
    this.resetInputs()
  }

  /**
   * Zaczyna numerację akcji od nowa (nowe połączenie przyjmuje stan w całości);
   * akcje jeszcze niezastosowane przepadają.
   */
  resetInputs(): void {
    this.lastSeq = 0
    this.lastInputTick = this.simTick
    this.ackSeq = 0
    this.pending = []
  }

  /**
   * Przyjmuje akcje z ticka `clientTick`, najpóźniej `maxTick`.
   * Zwraca `false`, gdy wiadomość łamie protokół (zła kolejność, cofnięty lub zbyt odległy tick).
   */
  accept(seq: number, clientTick: number, actions: readonly Action[], maxTick: number): boolean {
    if (seq !== this.lastSeq + 1 || clientTick < this.lastInputTick || clientTick > maxTick) {
      return false
    }
    this.lastSeq = seq
    this.lastInputTick = clientTick
    this.pending.push({ seq, tick: Math.max(clientTick, this.simTick), actions })
    return true
  }

  /** Stosuje akcje przypadające na bieżący tick i liczy jeden tick gry. */
  step(): void {
    while (this.pending[0] && this.pending[0].tick <= this.simTick) {
      const input = this.pending.shift()!
      for (const action of input.actions) {
        this.game = applyAction(this.game, action)
      }
      this.ackSeq = input.seq
    }
    this.game = tick(this.game)
    this.simTick++
  }
}
