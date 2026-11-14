export const MAX_FAILURES = 5;
export const LOCK_MS = 15 * 60 * 1000;
/** Górna granica wpisów, żeby zalew losowych loginów nie zjadł pamięci. */
const MAX_ENTRIES = 10_000;

interface Entry {
  failures: number;
  /** Koniec blokady albo okna liczenia nieudanych prób. */
  until: number;
}

/**
 * Limit nieudanych logowań na login (spec 005): po MAX_FAILURES próbach login jest
 * zablokowany na LOCK_MS. Na IP nie liczymy, bo Traefik nie widzi adresów klientów.
 */
export class LoginLimiter {
  private readonly entries = new Map<string, Entry>();

  constructor(private readonly now: () => number = Date.now) {}

  /** Ile ms zostało do końca blokady (0, gdy można próbować). */
  retryAfterMs(username: string): number {
    const entry = this.entries.get(username);
    if (!entry || entry.failures < MAX_FAILURES) return 0;
    const left = entry.until - this.now();
    if (left <= 0) this.entries.delete(username);
    return Math.max(0, left);
  }

  fail(username: string): void {
    const now = this.now();
    const entry = this.entries.get(username);
    const failures = entry && entry.until > now ? entry.failures + 1 : 1;
    this.entries.delete(username); // ponowne wstawienie przesuwa wpis na koniec (najnowszy)
    this.entries.set(username, { failures, until: now + LOCK_MS });
    if (this.entries.size > MAX_ENTRIES) {
      const oldest = this.entries.keys().next().value;
      if (oldest !== undefined) this.entries.delete(oldest);
    }
  }

  succeed(username: string): void {
    this.entries.delete(username);
  }
}
