import {
  clearLines,
  collides,
  createEmptyBoard,
  dropDistance,
  lockPiece,
  type Board,
} from './board'
import { attackLines, cancelGarbage, insertGarbage, type GarbageBatch } from './garbage'
import { spawnPiece, type Piece, type PieceType } from './pieces'
import { generateBag } from './random'
import { rotate } from './rotation'
import {
  HARD_DROP_POINTS,
  SOFT_DROP_POINTS,
  gravityTicks,
  levelForLines,
  lineClearScore,
} from './scoring'

export type Action = 'left' | 'right' | 'rotateCw' | 'rotateCcw' | 'softDrop' | 'hardDrop' | 'hold'
export type GameStatus = 'playing' | 'over'

export interface GameState {
  readonly board: Board
  readonly active: Piece
  readonly queue: readonly PieceType[]
  readonly hold: PieceType | null
  readonly canHold: boolean
  readonly rng: number
  readonly score: number
  readonly lines: number
  readonly level: number
  readonly status: GameStatus
  readonly ticks: number
  readonly gravityCounter: number
  readonly lockCounter: number
  readonly lockResets: number
  readonly lowestY: number
  /** Śmieci czekające na wstawienie przy następnym położeniu klocka bez czyszczenia linii. */
  readonly garbage: readonly GarbageBatch[]
  /** Linie śmieci wysłane przeciwnikom od początku gry (po skasowaniu własnej kolejki). */
  readonly linesSent: number
}

export const LOCK_DELAY_TICKS = 30
export const MAX_LOCK_RESETS = 15
export const PREVIEW_SIZE = 3
const MIN_QUEUE = 7

const refillQueue = (
  queue: readonly PieceType[],
  rng: number,
): { queue: readonly PieceType[]; rng: number } => {
  let result = queue
  let state = rng
  while (result.length < MIN_QUEUE) {
    const next = generateBag(state)
    result = [...result, ...next.bag]
    state = next.rng
  }
  return { queue: result, rng: state }
}

const spawn = (state: GameState, type: PieceType): GameState => {
  const active = spawnPiece(type)
  return {
    ...state,
    active,
    gravityCounter: 0,
    lockCounter: 0,
    lockResets: 0,
    lowestY: active.y,
    status: collides(state.board, active) ? 'over' : state.status,
  }
}

const spawnNext = (state: GameState): GameState => {
  const [next, ...rest] = state.queue
  const refilled = refillQueue(rest, state.rng)
  return spawn({ ...state, queue: refilled.queue, rng: refilled.rng }, next ?? 'I')
}

const isGrounded = (state: GameState): boolean => {
  return collides(state.board, { ...state.active, y: state.active.y + 1 })
}

/** Ruch lub rotacja w trakcie liczenia lock delay resetuje licznik (maks. MAX_LOCK_RESETS razy). */
const moveTo = (state: GameState, active: Piece): GameState => {
  let { lockCounter, lockResets, lowestY } = state
  if (active.y > lowestY) {
    lowestY = active.y
    lockResets = 0
  }
  if (lockCounter > 0 && lockResets < MAX_LOCK_RESETS) {
    lockCounter = 0
    lockResets++
  }
  return { ...state, active, lockCounter, lockResets, lowestY }
}

/**
 * Kładzie klocek. Wyczyszczone linie najpierw kasują własną kolejkę śmieci, a reszta ataku
 * trafia do `linesSent`; położenie bez czyszczenia wstawia całą kolejkę na planszę (spec silnik-gry).
 */
const lockActive = (state: GameState): GameState => {
  const cleared = clearLines(lockPiece(state.board, state.active))
  let { board } = cleared
  let { garbage, linesSent } = state
  let toppedOut = false
  if (cleared.cleared > 0) {
    const cancel = cancelGarbage(garbage, attackLines(cleared.cleared))
    garbage = cancel.queue
    linesSent += cancel.remaining
  } else if (garbage.length > 0) {
    const inserted = insertGarbage(board, garbage)
    board = inserted.board
    toppedOut = inserted.toppedOut
    garbage = []
  }

  const lines = state.lines + cleared.cleared
  const next = spawnNext({
    ...state,
    board,
    garbage,
    linesSent,
    score: state.score + lineClearScore(cleared.cleared, state.level),
    lines,
    level: levelForLines(lines),
    canHold: true,
  })
  return toppedOut ? { ...next, status: 'over' } : next
}

/** Dodaje paczkę śmieci od przeciwnika na koniec kolejki. */
export const receiveGarbage = (state: GameState, batch: GarbageBatch): GameState => {
  if (state.status === 'over' || batch.lines <= 0) {
    return state
  }
  return { ...state, garbage: [...state.garbage, batch] }
}

export const createGame = (seed: number): GameState => {
  const { queue, rng } = refillQueue([], seed >>> 0)
  return spawnNext({
    board: createEmptyBoard(),
    active: spawnPiece('I'),
    queue,
    hold: null,
    canHold: true,
    rng,
    score: 0,
    lines: 0,
    level: 1,
    status: 'playing',
    ticks: 0,
    gravityCounter: 0,
    lockCounter: 0,
    lockResets: 0,
    lowestY: 0,
    garbage: [],
    linesSent: 0,
  })
}

const shift = (state: GameState, dx: number): GameState => {
  const moved = { ...state.active, x: state.active.x + dx }
  return collides(state.board, moved) ? state : moveTo(state, moved)
}

export const applyAction = (state: GameState, action: Action): GameState => {
  if (state.status === 'over') {
    return state
  }

  switch (action) {
    case 'left':
      return shift(state, -1)
    case 'right':
      return shift(state, 1)
    case 'rotateCw':
    case 'rotateCcw': {
      const rotated = rotate(state.board, state.active, action === 'rotateCw' ? 1 : -1)
      return rotated ? moveTo(state, rotated) : state
    }
    case 'softDrop': {
      const moved = { ...state.active, y: state.active.y + 1 }
      if (collides(state.board, moved)) {
        return state
      }
      return {
        ...moveTo(state, moved),
        score: state.score + SOFT_DROP_POINTS,
        gravityCounter: 0,
      }
    }
    case 'hardDrop': {
      const distance = dropDistance(state.board, state.active)
      return lockActive({
        ...state,
        active: { ...state.active, y: state.active.y + distance },
        score: state.score + distance * HARD_DROP_POINTS,
      })
    }
    case 'hold': {
      if (!state.canHold) {
        return state
      }
      const held = { ...state, hold: state.active.type }
      const next = state.hold === null ? spawnNext(held) : spawn(held, state.hold)
      return { ...next, canHold: false }
    }
  }
}

export const tick = (state: GameState): GameState => {
  if (state.status === 'over') {
    return state
  }
  const ticks = state.ticks + 1

  if (isGrounded(state)) {
    const lockCounter = state.lockCounter + 1
    if (lockCounter >= LOCK_DELAY_TICKS) {
      return lockActive({ ...state, ticks })
    }
    return { ...state, ticks, lockCounter }
  }

  const gravityCounter = state.gravityCounter + 1
  if (gravityCounter < gravityTicks(state.level)) {
    return { ...state, ticks, gravityCounter }
  }

  const active = { ...state.active, y: state.active.y + 1 }
  return {
    ...state,
    ticks,
    active,
    gravityCounter: 0,
    lockCounter: 0,
    lockResets: active.y > state.lowestY ? 0 : state.lockResets,
    lowestY: Math.max(active.y, state.lowestY),
  }
}

/** Pozycja, w której klocek wylądowałby po hard dropie. */
export const ghostPiece = (state: Pick<GameState, 'board' | 'active'>): Piece => {
  return { ...state.active, y: state.active.y + dropDistance(state.board, state.active) }
}

/** Następne klocki do podglądu. */
export const previewQueue = (state: GameState): readonly PieceType[] => {
  return state.queue.slice(0, PREVIEW_SIZE)
}
