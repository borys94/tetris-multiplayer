import { applyAction, createGame, tick, type Action, type GameState } from "@tetris/game-core";
import { SNAPSHOT_INTERVAL_TICKS, type ServerMessage } from "@tetris/protocol";

export type Send = (msg: ServerMessage) => void;

export interface SessionOptions {
  /** O ile ticków symulacja idzie za zegarem sesji (bufor wejścia, ADR-0006). */
  bufferTicks: number;
  /** O ile ticków akcja klienta może wyprzedzać zegar serwera, zanim ją odrzucimy. */
  maxAheadTicks: number;
}

interface PendingInput {
  seq: number;
  /** Tick, na którym serwer zastosuje akcje (nie wcześniej niż bieżący tick symulacji). */
  tick: number;
  actions: readonly Action[];
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
  private game: GameState;
  private simTick = 0;
  private clock = 0;
  private paused = true;
  private over = false;
  private lastSeq = 0;
  private lastInputTick = 0;
  private ackSeq = 0;
  private pending: PendingInput[] = [];
  private send: Send | null = null;

  constructor(
    readonly id: string,
    readonly token: string,
    seed: number,
    private readonly options: SessionOptions,
  ) {
    this.game = createGame(seed);
  }

  get connected(): boolean {
    return this.send !== null;
  }

  /** Podłącza połączenie i wysyła mu bieżący stan; gra jest wtedy wstrzymana. */
  attach(send: Send): void {
    this.send = send;
    this.sendGame();
  }

  /** Odłącza połączenie; rozłączenie działa jak pauza na bieżącym ticku zegara. */
  detach(): void {
    this.pauseAt(this.clock);
    this.send = null;
  }

  newGame(seed: number): void {
    this.game = createGame(seed);
    this.simTick = 0;
    this.clock = 0;
    this.paused = true;
    this.over = false;
    this.lastSeq = 0;
    this.lastInputTick = 0;
    this.ackSeq = 0;
    this.pending = [];
    this.sendGame();
  }

  /** Przyjmuje akcje klienta. Zwraca `false`, gdy wiadomość łamie protokół. */
  input(seq: number, clientTick: number, actions: readonly Action[]): boolean {
    if (this.over) return true; // klient nie wiedział jeszcze o końcu gry
    if (this.paused || seq !== this.lastSeq + 1 || clientTick < this.lastInputTick) return false;
    if (clientTick > this.clock + this.options.maxAheadTicks) return false;

    this.lastSeq = seq;
    this.lastInputTick = clientTick;
    this.pending.push({ seq, tick: Math.max(clientTick, this.simTick), actions });
    return true;
  }

  /** Pauza na ticku klienta, ograniczonym do zakresu, którego klient nie może nadużyć. */
  pause(clientTick: number): void {
    const target = Math.min(
      Math.max(clientTick, this.simTick),
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
      while (!this.over && this.simTick < this.clock - this.options.bufferTicks) this.step();
    }
  }

  private pauseAt(target: number): void {
    if (this.paused || this.over) return;
    while (!this.over && this.simTick < target) this.step();
    this.clock = this.simTick;
    this.paused = true;
    if (!this.over) this.sendSnapshot();
  }

  private step(): void {
    while (this.pending[0] && this.pending[0].tick <= this.simTick) {
      const input = this.pending.shift()!;
      for (const action of input.actions) this.game = applyAction(this.game, action);
      this.ackSeq = input.seq;
    }
    this.game = tick(this.game);
    this.simTick++;

    if (this.game.status === "over") {
      this.over = true;
      this.sendSnapshot();
      const { score, lines, level } = this.game;
      this.send?.({ type: "over", score, lines, level });
    } else if (this.simTick % SNAPSHOT_INTERVAL_TICKS === 0) {
      this.sendSnapshot();
    }
  }

  private sendSnapshot(): void {
    this.send?.({ type: "snapshot", tick: this.simTick, ackSeq: this.ackSeq, state: this.game });
  }

  private sendGame(): void {
    this.send?.({
      type: "game",
      tick: this.simTick,
      state: this.game,
      paused: this.paused || this.over,
    });
  }
}
