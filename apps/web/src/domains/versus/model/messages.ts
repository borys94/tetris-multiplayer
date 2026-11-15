import type { ServerMessage } from '@tetris/protocol'

/** Stan pokoju z serwera (spec versus-1v1). */
export type RoomMessage = Extract<ServerMessage, { type: 'room' }>
/** Wynik meczu z punktu widzenia gracza. */
export type ResultMessage = Extract<ServerMessage, { type: 'result' }>
