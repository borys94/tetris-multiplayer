// @vitest-environment node
import { createGame } from '@tetris/game-core'
import type { ClientMessage } from '@tetris/protocol'
import { describe, expect, it } from 'vitest'
import { SoloSession } from '../../../../src/domains/game/model/solo-session'

const setup = (online = true) => {
  const sent: ClientMessage[] = []
  const session = new SoloSession((msg) => {
    sent.push(msg)
    return online
  })
  return { session, sent }
}

const game = (tick = 0) => ({ type: 'game', tick, state: createGame(1), paused: true }) as const

describe('SoloSession', () => {
  it('shows the start screen for a new game and plays after Enter', () => {
    const { session, sent } = setup()
    session.receive(game())
    expect(session.getState().screen).toBe('ready')

    expect(session.keyDown('Enter', false)).toBe(false)
    expect(sent).toEqual([{ type: 'resume' }])
    expect(session.getState().screen).toBe('playing')
  })

  it('pauses a resumed game instead of showing the start screen', () => {
    const { session } = setup()
    session.receive(game(120))
    expect(session.getState().screen).toBe('paused')
  })

  it('sends game keys only while playing and pauses on P at the predicted tick', () => {
    const { session, sent } = setup()
    session.receive(game())
    expect(session.keyDown('Space', false)).toBe(false)

    session.play()
    expect(session.keyDown('Space', false)).toBe(true)
    session.tick()
    expect(sent.at(-1)).toMatchObject({ type: 'input', seq: 1, tick: 0, actions: ['hardDrop'] })

    session.keyDown('KeyP', false)
    expect(sent.at(-1)).toEqual({ type: 'pause', tick: 1 })
    expect(session.getState().screen).toBe('paused')
  })

  it('pauses locally when the connection drops, without messaging the server', () => {
    const { session, sent } = setup()
    session.receive(game())
    session.play()
    session.connectionChanged('offline')
    expect(session.getState().screen).toBe('paused')
    expect(sent).toEqual([{ type: 'resume' }])
  })

  it('starts the next game as soon as the server sends it after newGame', () => {
    const { session, sent } = setup()
    session.receive(game())
    session.receive({ type: 'over', score: 300, lines: 2, level: 1 })
    expect(session.getState()).toMatchObject({ screen: 'over', result: { score: 300 } })

    session.newGame()
    expect(session.getState()).toMatchObject({ screen: 'loading', result: null })
    session.receive(game())
    expect(sent.slice(-2)).toEqual([{ type: 'newGame' }, { type: 'resume' }])
    expect(session.getState().screen).toBe('playing')
  })

  it('does not start when the server is unreachable', () => {
    const { session } = setup(false)
    session.receive(game())
    session.play()
    expect(session.getState().screen).toBe('ready')
  })

  it('asks the view to redraw and updates the HUD only when it changes', () => {
    const { session } = setup()
    let draws = 0
    session.boardChanged.watch(() => draws++)
    let renders = 0
    session.subscribe(() => renders++)

    session.receive(game())
    const afterGame = renders
    session.refresh()
    expect(draws).toBe(2)
    expect(renders).toBe(afterGame)
    expect(session.getState().hud.next.length).toBeGreaterThan(0)
  })
})
