import { createGame, type Action } from "@tetris/game-core";
import { SNAPSHOT_INTERVAL_TICKS, type ServerMessage } from "@tetris/protocol";
import { BufferedGame } from "./buffered-game";

export type Send = (msg: ServerMessage) => void;

/** Wynik zakończonej gry, liczony przez serwer. */
export interface GameOver {
  score: number;
  lines: number;
  level: number;
  ticks: number;
}

export interface SessionOptions {
  /** O ile ticków symulacja idzie za zegarem sesji (bufor wejścia, ADR-0006). */
  bufferTicks: number;
  /** O ile ticków akcja klienta może wyprzedzać zegar serwera, zanim ją odrzucimy. */
  maxAheadTicks: number;
}

/**
 * Jedna gra jednego gracza liczona przez serwer (ADR-0006).
 *
 * Zegar (`clock`) liczy ticki czasu rzeczywistego, gdy gra nie jest wstrzymana.
 * Symulacja (`simTick`) idzie `bufferTicks` za zegarem, więc akcja klienta z tickiem `t`
 * trafia dokładnie na `t`, jeśli dotrze w czasie bufora, a później na bieżący tick symulacji.
 * Klient nie może więc ani cofnąć czasu o więcej niż bufor, ani go zatrzymać.
 */
export class Session {
  private readonly sim: BufferedGame;
  private clock = 0;
  private paused = true;
  private over = false;
  private send: Send | null = null;
  /** Konto, na które zapisujemy wynik; `null` to gość (spec 005). */
  userId: number | null = null;
  /** Wywoływane raz na koniec każdej gry. */
  onOver: ((result: GameOver) => void) | null = null;

  constructor(
    readonly id: string,
    readonly token: string,
    seed: number,
    private readonly options: SessionOptions,
  ) {
    this.sim = new BufferedGame(createGame(seed));
  }

  get connected(): boolean {
    return this.send !== null;
  }

  /**
   * Podłącza połączenie i wysyła mu bieżący stan; gra jest wtedy wstrzymana.
   * Klient przyjmuje ten stan w całości, więc numeracja akcji zaczyna się od nowa,
   * a akcje jeszcze niezastosowane (wyprzedzające zegar w chwili rozłączenia) przepadają.
   */
  attach(send: Send): void {
    this.send = send;
    this.sim.resetInputs();
    this.sendGame();
  }

  /** Wstrzymuje grę na bieżącym ticku zegara (np. gdy gracz przechodzi do pokoju, spec 007). */
  suspend(): void {
    this.pauseAt(this.clock);
  }

  /** Odłącza połączenie; rozłączenie działa jak pauza na bieżącym ticku zegara. */
  detach(): void {
    this.pauseAt(this.clock);
    this.send = null;
  }

  newGame(seed: number): void {
    this.sim.reset(createGame(seed));
    this.clock = 0;
    this.paused = true;
    this.over = false;
    this.sendGame();
  }

  /** Przyjmuje akcje klienta. Zwraca `false`, gdy wiadomość łamie protokół. */
  input(seq: number, clientTick: number, actions: readonly Action[]): boolean {
    if (this.over) return true; // klient nie wiedział jeszcze o końcu gry
    if (this.paused) return false;
    return this.sim.accept(seq, clientTick, actions, this.clock + this.options.maxAheadTicks);
  }

  /** Pauza na ticku klienta, ograniczonym do zakresu, którego klient nie może nadużyć. */
  pause(clientTick: number): void {
    const target = Math.min(
      Math.max(clientTick, this.sim.simTick),
      this.clock + this.options.maxAheadTicks,
    );
    this.pauseAt(target);
  }

  resume(): void {
    if (!this.over) this.paused = false;
  }

  /** Przesuwa zegar sesji o `ticks` ticków czasu rzeczywistego. */
  advance(ticks: number): void {
    if (this.paused || this.over) return;
    for (let i = 0; i < ticks; i++) {
      this.clock++;
      while (!this.over && this.sim.simTick < this.clock - this.options.bufferTicks) this.step();
    }
  }

  private pauseAt(target: number): void {
    if (this.paused || this.over) return;
    while (!this.over && this.sim.simTick < target) this.step();
    this.clock = this.sim.simTick;
    this.paused = true;
    if (!this.over) this.sendSnapshot();
  }

  private step(): void {
    this.sim.step();

    if (this.sim.over) {
      this.over = true;
      this.sendSnapshot();
      const { score, lines, level } = this.sim.game;
      this.send?.({ type: "over", score, lines, level });
      this.onOver?.({ score, lines, level, ticks: this.sim.simTick });
    } else if (this.sim.simTick % SNAPSHOT_INTERVAL_TICKS === 0) {
      this.sendSnapshot();
    }
  }

  private sendSnapshot(): void {
    const { simTick, ackSeq, game } = this.sim;
    this.send?.({ type: "snapshot", tick: simTick, ackSeq, state: game });
  }

  private sendGame(): void {
    this.send?.({
      type: "game",
      tick: this.sim.simTick,
      state: this.sim.game,
      paused: this.paused || this.over,
    });
  }
}
