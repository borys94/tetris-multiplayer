import { describe, expect, it } from 'vitest'
import { sameHud } from '../../../src/core/play/hud'

describe('sameHud', () => {
  it('compares fields and lists by value', () => {
    const hud = { score: 10, hold: null, next: ['I', 'O'] }
    expect(sameHud(hud, { score: 10, hold: null, next: ['I', 'O'] })).toBe(true)
    expect(sameHud(hud, { score: 11, hold: null, next: ['I', 'O'] })).toBe(false)
    expect(sameHud(hud, { score: 10, hold: null, next: ['I'] })).toBe(false)
    expect(sameHud(hud, { score: 10, hold: null, next: ['O', 'I'] })).toBe(false)
  })
})
