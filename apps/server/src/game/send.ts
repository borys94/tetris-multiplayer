import type { ServerMessage } from '@tetris/protocol'

/** Ujście wiadomości do jednego klienta; sesje i pokoje nie wiedzą, czy to WebSocket, czy test. */
export type Send = (msg: ServerMessage) => void
