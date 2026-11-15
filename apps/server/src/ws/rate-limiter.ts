/** Token bucket: `take()` zwraca `false`, gdy klient przekroczył limit. */
export class RateLimiter {
  private tokens: number
  private last = performance.now()

  constructor(
    private readonly perSecond: number,
    private readonly burst: number,
  ) {
    this.tokens = burst
  }

  take(): boolean {
    const now = performance.now()
    this.tokens = Math.min(this.burst, this.tokens + ((now - this.last) / 1000) * this.perSecond)
    this.last = now
    if (this.tokens < 1) {
      return false
    }
    this.tokens--
    return true
  }
}
