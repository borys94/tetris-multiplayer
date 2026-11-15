import { describe, expect, it } from 'vitest'
import { formatClock, formatDuration } from '../../src/core/format'

describe('formatting', () => {
  it('shows durations as m:ss', () => {
    expect(formatClock(0)).toBe('0:00')
    expect(formatClock(75)).toBe('1:15')
    expect(formatDuration(60 * 125)).toBe('2:05') // 60 ticków na sekundę
  })
})
