import { randomBytes, timingSafeEqual } from "node:crypto";
import { gamesFinished, tickDuration, ticksDropped } from "../observability/metrics";
import { Session, type GameOver, type SessionOptions } from "./session";
import { startTickLoop } from "./tick-loop";

export interface SessionStoreOptions extends SessionOptions {
  maxSessions: number;
  /** Jak długo sesja bez połączenia czeka na wznowienie (ms). */
  ttlMs: number;
  /** Koniec gry w dowolnej sesji (np. zapis wyniku zalogowanego gracza). */
  onGameOver?: (session: Session, result: GameOver) => void;
}

function randomId(): string {
  return randomBytes(16).toString("base64url");
}

export function randomSeed(): number {
  return randomBytes(4).readUInt32LE();
}

function sameToken(a: string, b: string): boolean {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
}

/** Sesje w pamięci procesu: tworzenie, wznawianie, wygasanie i wspólna pętla 60 ticków/s. */
export class SessionStore {
  private readonly sessions = new Map<string, Session>();
  private readonly detachedAt = new Map<string, number>();

  constructor(
    private readonly options: SessionStoreOptions,
    private readonly now: () => number = () => performance.now(),
  ) {}

  get size(): number {
    return this.sessions.size;
  }

  /** Nowa sesja albo `null`, gdy serwer jest pełny. */
  create(): Session | null {
    this.expire();
    if (this.sessions.size >= this.options.maxSessions) return null;
    const session = new Session(randomId(), randomId(), randomSeed(), this.options);
    const { onGameOver } = this.options;
    session.onOver = (result) => {
      gamesFinished.inc({ player: session.userId === null ? "guest" : "user" });
      onGameOver?.(session, result);
    };
    this.sessions.set(session.id, session);
    return session;
  }

  /** Sesja do wznowienia albo `null`, gdy wygasła lub token się nie zgadza. */
  find(id: string, token: string): Session | null {
    this.expire();
    const session = this.sessions.get(id);
    return session && sameToken(session.token, token) ? session : null;
  }

  markAttached(session: Session): void {
    this.detachedAt.delete(session.id);
  }

  markDetached(session: Session): void {
    this.detachedAt.set(session.id, this.now());
  }

  /** Przesuwa wszystkie sesje o `ticks` ticków. */
  advance(ticks: number): void {
    for (const session of this.sessions.values()) session.advance(ticks);
  }

  /** Usuwa sesje, które za długo czekają na wznowienie. */
  expire(): void {
    const deadline = this.now() - this.options.ttlMs;
    for (const [id, since] of this.detachedAt) {
      if (since <= deadline) {
        this.detachedAt.delete(id);
        this.sessions.delete(id);
      }
    }
  }

  /**
   * Uruchamia pętlę czasu rzeczywistego; `alsoAdvance` (np. pokoje 1v1) liczy się w tym samym
   * obiegu, więc `blockfall_tick_duration_seconds` i alert wolnego ticka obejmują całą grę.
   * Zwraca funkcję, która zatrzymuje pętlę.
   */
  start(alsoAdvance?: (ticks: number) => void): () => void {
    const stopLoop = startTickLoop(
      this.now,
      (ticks) => {
        const stopTimer = tickDuration.startTimer();
        this.advance(ticks);
        alsoAdvance?.(ticks);
        stopTimer();
      },
      (dropped) => ticksDropped.inc(dropped),
    );
    const sweep = setInterval(() => this.expire(), 1000);
    return () => {
      stopLoop();
      clearInterval(sweep);
    };
  }
}
