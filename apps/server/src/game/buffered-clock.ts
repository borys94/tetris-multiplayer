export interface BufferedClockOptions {
  /** O ile ticków symulacja idzie za zegarem (bufor wejścia, ADR-0006). */
  bufferTicks: number
  /** O ile ticków akcja klienta może wyprzedzać zegar serwera, zanim ją odrzucimy. */
  maxAheadTicks: number
}

/**
 * Zegar czasu rzeczywistego z symulacją opóźnioną o bufor wejścia (ADR-0006), wspólny
 * dla sesji singleplayer i meczu w pokoju. Sam nie liczy gry: po każdym ticku zegara
 * mówi właścicielowi, do którego ticka symulacja ma dojść.
 */
export class BufferedClock {
  private clock = 0

  constructor(private readonly options: BufferedClockOptions) {}

  get tick(): number {
    return this.clock
  }

  /** Najdalszy tick akcji klienta, który jeszcze przyjmujemy. */
  get maxInputTick(): number {
    return this.clock + this.options.maxAheadTicks
  }

  /** Przesuwa zegar o `ticks`; po każdym ticku symulacja ma dogonić `catchUp(target)`. */
  advance(ticks: number, catchUp: (target: number) => void): void {
    for (let i = 0; i < ticks; i++) {
      this.clock++
      catchUp(this.clock - this.options.bufferTicks)
    }
  }

  /** Ustawia zegar na ticku symulacji (pauza: po wznowieniu bufor napełnia się od nowa). */
  set(tick: number): void {
    this.clock = tick
  }
}
