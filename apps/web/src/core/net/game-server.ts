import type { ClientMessage } from '@tetris/protocol'
import { Connection, defaultServerUrl, type ConnectionHandlers } from './connection'

/** Połączenie z serwerem gry widziane przez aplikację (podmieniane w testach). */
export interface GameServer {
  send(msg: ClientMessage): boolean
  stop(): void
}

export type ConnectFn = (handlers: ConnectionHandlers) => GameServer

/** Wysyła wiadomość; `false`, gdy połączenie nie jest otwarte. */
export type Send = (msg: ClientMessage) => boolean

export const connectToServer: ConnectFn = (handlers) => {
  const connection = new Connection(defaultServerUrl(window.location), handlers)
  connection.start()
  return connection
}
