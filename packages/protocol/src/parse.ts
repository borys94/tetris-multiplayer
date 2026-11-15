import type { Action } from '@tetris/game-core'
import {
  ACTIONS,
  MAX_ACTIONS_PER_INPUT,
  MAX_MESSAGE_BYTES,
  ROOM_CODE_ALPHABET,
  ROOM_CODE_LENGTH,
  type ClientMessage,
  type ServerMessage,
} from './messages'

const MAX_COUNTER = 2 ** 31 - 1
const ID_PATTERN = /^[A-Za-z0-9_-]{16,64}$/

type Json = Record<string, unknown>

const parseObject = (raw: string): Json | null => {
  try {
    const value: unknown = JSON.parse(raw)
    return typeof value === 'object' && value !== null && !Array.isArray(value)
      ? (value as Json)
      : null
  } catch {
    return null
  }
}

const isCounter = (value: unknown, min: number): value is number => {
  return Number.isInteger(value) && (value as number) >= min && (value as number) <= MAX_COUNTER
}

const isId = (value: unknown): value is string => {
  return typeof value === 'string' && ID_PATTERN.test(value)
}

/** Kod pokoju bez względu na wielkość liter; zwraca go wielkimi literami. */
const parseRoomCode = (value: unknown): string | null => {
  if (typeof value !== 'string' || value.length !== ROOM_CODE_LENGTH) {
    return null
  }
  const code = value.toUpperCase()
  return [...code].every((char) => ROOM_CODE_ALPHABET.includes(char)) ? code : null
}

const isAction = (value: unknown): value is Action => {
  return (ACTIONS as readonly unknown[]).includes(value)
}

const parseActions = (value: unknown): Action[] | null => {
  if (!Array.isArray(value) || value.length === 0 || value.length > MAX_ACTIONS_PER_INPUT) {
    return null
  }
  return value.every(isAction) ? value : null
}

/**
 * Waliduje wiadomość od klienta. Zwraca nowy obiekt z samymi znanymi polami
 * albo `null`, gdy wiadomość jest za duża, nie jest JSON-em lub ma złą strukturę.
 */
export const parseClientMessage = (raw: string): ClientMessage | null => {
  if (raw.length > MAX_MESSAGE_BYTES) {
    return null
  }
  const msg = parseObject(raw)
  if (!msg) {
    return null
  }

  switch (msg.type) {
    case 'hello': {
      if (!isCounter(msg.protocol, 0)) {
        return null
      }
      if (msg.resume === undefined) {
        return { type: 'hello', protocol: msg.protocol }
      }
      const resume = msg.resume as Json | null
      if (typeof resume !== 'object' || resume === null) {
        return null
      }
      if (!isId(resume.sessionId) || !isId(resume.token)) {
        return null
      }
      return {
        type: 'hello',
        protocol: msg.protocol,
        resume: { sessionId: resume.sessionId, token: resume.token },
      }
    }
    case 'newGame':
    case 'resume':
    case 'watchRooms':
    case 'unwatchRooms':
    case 'leaveRoom':
    case 'ready':
      return { type: msg.type }
    case 'createRoom':
      return msg.visibility === 'public' || msg.visibility === 'private'
        ? { type: 'createRoom', visibility: msg.visibility }
        : null
    case 'joinRoom': {
      const code = parseRoomCode(msg.code)
      return code ? { type: 'joinRoom', code } : null
    }
    case 'input': {
      const actions = parseActions(msg.actions)
      if (!isCounter(msg.seq, 1) || !isCounter(msg.tick, 0) || !actions) {
        return null
      }
      return { type: 'input', seq: msg.seq, tick: msg.tick, actions }
    }
    case 'pause':
      return isCounter(msg.tick, 0) ? { type: 'pause', tick: msg.tick } : null
    default:
      return null
  }
}

const SERVER_TYPES: ReadonlySet<unknown> = new Set([
  'welcome',
  'game',
  'snapshot',
  'over',
  'error',
  'rooms',
  'room',
  'roomClosed',
  'match',
  'matchSnapshot',
  'result',
])

/** Odczytuje wiadomość od serwera; serwerowi ufamy, więc sprawdzamy tylko JSON i typ. */
export const parseServerMessage = (raw: string): ServerMessage | null => {
  const msg = parseObject(raw)
  return msg && SERVER_TYPES.has(msg.type) ? (msg as unknown as ServerMessage) : null
}
