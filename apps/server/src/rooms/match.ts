import {
  TICKS_PER_SECOND,
  createGame,
  randomHole,
  receiveGarbage,
  type Action,
} from '@tetris/game-core'
import { SNAPSHOT_INTERVAL_TICKS, type OpponentView } from '@tetris/protocol'
import { BufferedClock, type BufferedClockOptions } from '../game/buffered-clock'
import { BufferedGame } from '../game/buffered-game'
import { randomSeed } from '../game/random'
import type { Send } from '../game/send'
import { garbageLines } from '../observability/metrics'

/** Miejsce gracza w meczu; `send` zmienia się przy wznowieniu połączenia, więc czytamy go zawsze na bieżąco. */
export interface Seat {
  readonly send: Send | null
}

interface Contender<S extends Seat> {
  seat: S
  game: BufferedGame
  /** Ile z `linesSent` gracza dostarczyliśmy już przeciwnikowi. */
  delivered: number
}

export interface MatchStats {
  score: number
  lines: number
  linesSent: number
}

const opponentView = (game: BufferedGame): OpponentView => {
  const { board, active, garbage, score, lines, linesSent, status } = game.game
  return { board, active, garbage, score, lines, linesSent, status }
}

/**
 * Jeden mecz w pokoju (spec versus-1v1, ADR-0010): gry wszystkich graczy liczone we wspólnym
 * zegarze, tym samym seedem i bez pauzy. Linie wysłane przez gracza trafiają do kolejki
 * przeciwnika na tym samym ticku. O członkostwie i wyniku decyduje pokój.
 */
export class Match<S extends Seat> {
  private readonly contenders: Contender<S>[]
  private readonly clock: BufferedClock
  private simTick = 0
  private holeRng: number
  private ended = false

  /** Gracz przegrał przez przepełnienie planszy (wołane w trakcie ticka symulacji). */
  onTopout: ((loser: S) => void) | null = null

  constructor(seats: readonly S[], options: BufferedClockOptions, seed = randomSeed()) {
    this.contenders = seats.map((seat) => ({
      seat,
      game: new BufferedGame(createGame(seed)),
      delivered: 0,
    }))
    this.clock = new BufferedClock(options)
    this.holeRng = randomSeed()
  }

  /** Ticki symulacji od startu meczu. */
  get ticks(): number {
    return this.simTick
  }

  get seconds(): number {
    return Math.floor(this.simTick / TICKS_PER_SECOND)
  }

  stats(seat: S): MatchStats {
    const game = this.find(seat)?.game.game
    return { score: game?.score ?? 0, lines: game?.lines ?? 0, linesSent: game?.linesSent ?? 0 }
  }

  /** Akcje gracza; `false`, gdy łamią protokół (zła kolejność, zbyt odległy tick). */
  input(seat: S, seq: number, clientTick: number, actions: readonly Action[]): boolean {
    const game = this.find(seat)?.game
    if (!game || this.ended) {
      return false
    }
    return game.accept(seq, clientTick, actions, this.clock.maxInputTick)
  }

  /** Nowe połączenie gracza przyjmuje stan gry w całości, więc numeracja akcji zaczyna się od nowa. */
  reattach(seat: S): void {
    const contender = this.find(seat)
    if (!contender) {
      return
    }
    contender.game.resetInputs()
    this.sendState(contender)
  }

  /** Wysyła wszystkim pełny stan meczu (start). */
  sendStates(): void {
    for (const contender of this.contenders) {
      this.sendState(contender)
    }
  }

  /** Kończy mecz: symulacja staje, gracze dostają ostatni stan plansz. */
  end(): void {
    this.ended = true
    this.sendSnapshots()
  }

  advance(ticks: number): void {
    if (this.ended) {
      return
    }
    this.clock.advance(ticks, (target) => {
      while (!this.ended && this.simTick < target) {
        this.step()
      }
    })
  }

  /** Jeden tick symulacji wszystkich graczy w stałej kolejności (kolejność dołączenia). */
  private step(): void {
    for (const contender of this.contenders) {
      contender.game.step()
      this.deliverGarbage(contender)
      if (contender.game.over) {
        this.onTopout?.(contender.seat)
        return
      }
    }
    this.simTick++
    if (this.simTick % SNAPSHOT_INTERVAL_TICKS === 0) {
      this.sendSnapshots()
    }
  }

  /** Linie wysłane przez gracza od ostatniego ticka trafiają jedną paczką do przeciwnika. */
  private deliverGarbage(contender: Contender<S>): void {
    const sent = contender.game.game.linesSent - contender.delivered
    const target = this.opponentOf(contender)?.game
    if (sent <= 0 || !target) {
      return
    }
    const { hole, rng } = randomHole(this.holeRng)
    this.holeRng = rng
    target.game = receiveGarbage(target.game, { lines: sent, hole })
    contender.delivered += sent
    garbageLines.inc(sent)
  }

  private sendState(contender: Contender<S>): void {
    const opponent = this.opponentOf(contender)?.game
    if (!opponent) {
      return
    }
    contender.seat.send?.({
      type: 'match',
      tick: this.simTick,
      state: contender.game.game,
      opponent: opponentView(opponent),
    })
  }

  private sendSnapshots(): void {
    for (const contender of this.contenders) {
      const opponent = this.opponentOf(contender)?.game
      if (!opponent) {
        continue
      }
      contender.seat.send?.({
        type: 'matchSnapshot',
        tick: this.simTick,
        ackSeq: contender.game.ackSeq,
        state: contender.game.game,
        opponent: opponentView(opponent),
      })
    }
  }

  private find(seat: S): Contender<S> | undefined {
    return this.contenders.find((c) => c.seat === seat)
  }

  private opponentOf(contender: Contender<S>): Contender<S> | undefined {
    return this.contenders.find((c) => c !== contender)
  }
}
