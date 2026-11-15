// @vitest-environment node
import { createGame } from '@tetris/game-core'
import { COUNTDOWN_MS, type ClientMessage } from '@tetris/protocol'
import { describe, expect, it } from 'vitest'
import { MatchSession, countdownSeconds } from '../../../../src/domains/versus/model/match-session'

const setup = () => {
  const sent: ClientMessage[] = []
  const session = new MatchSession((msg) => {
    sent.push(msg)
    return true
  })
  return { session, sent }
}

const opponent = () => {
  const { board, active, garbage, score, lines, linesSent, status } = createGame(1)
  return { board, active, garbage, score, lines, linesSent, status }
}

describe('MatchSession', () => {
  it('plays a match from start to result and back to idle when the room closes', () => {
    const { session, sent } = setup()
    session.receive({ type: 'match', tick: 0, state: createGame(1), opponent: opponent() })
    expect(session.getState().phase).toBe('playing')
    expect(session.opponent).not.toBeNull()

    expect(session.keyDown('ArrowLeft', false)).toBe(true)
    session.tick()
    expect(sent).toEqual([{ type: 'input', seq: 1, tick: 0, actions: ['left'] }])

    session.receive({ type: 'result', won: true, winner: 'ala', reason: 'topout' })
    expect(session.getState()).toMatchObject({ phase: 'over', result: { won: true } })

    session.receive({ type: 'roomClosed' })
    expect(session.getState()).toMatchObject({ phase: 'idle', result: null })
    expect(session.board).toBeNull()
  })

  it('releases held keys on blur instead of pausing', () => {
    const { session, sent } = setup()
    session.receive({ type: 'match', tick: 0, state: createGame(1), opponent: opponent() })
    session.keyDown('ArrowDown', false)
    session.tick()
    session.blur()
    session.tick()
    session.tick()
    expect(sent).toHaveLength(1)
    expect(session.getState().phase).toBe('playing')
  })
})

describe('countdownSeconds', () => {
  it('rounds up and never shows more than the countdown length', () => {
    expect(countdownSeconds(10_000, 7_500)).toBe(3)
    expect(countdownSeconds(10_000, 10_000)).toBe(0)
    expect(countdownSeconds(100_000, 0)).toBe(COUNTDOWN_MS / 1000)
  })
})
