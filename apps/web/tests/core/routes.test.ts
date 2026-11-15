import { describe, expect, it } from 'vitest'
import { legacyHashPath, ROOM_CODE, roomLink } from '../../src/core/routes'

describe('routes', () => {
  it('builds a room link from the origin', () => {
    expect(roomLink('ABC123')).toBe(`${window.location.origin}/pokoj/ABC123`)
  })

  it('accepts only six-character room codes', () => {
    expect(ROOM_CODE.test('ABC123')).toBe(true)
    expect(ROOM_CODE.test('ABC')).toBe(false)
  })

  it('turns old hash links into paths', () => {
    expect(legacyHashPath('#/pokoj/ABC123')).toBe('/pokoj/ABC123')
    expect(legacyHashPath('#/ranking')).toBe('/ranking')
    expect(legacyHashPath('')).toBeNull()
    expect(legacyHashPath('#kotwica')).toBeNull()
  })
})
