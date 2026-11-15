import { once } from 'node:events'
import type { ServerMessage } from '@tetris/protocol'
import { WebSocket } from 'ws'

export interface TestClient {
  ws: WebSocket
  messages: ServerMessage[]
  send(msg: unknown): void
  /** Czeka na wiadomość danego typu, której jeszcze nie odebraliśmy w tym kliencie. */
  next<T extends ServerMessage['type']>(type: T): Promise<Extract<ServerMessage, { type: T }>>
}

/** Klient WebSocket do testów: zbiera wiadomości i pozwala czekać na kolejne danego typu. */
export const connectClient = async (
  url: string,
  headers: Record<string, string>,
): Promise<TestClient> => {
  const ws = new WebSocket(url, { headers })
  const messages: ServerMessage[] = []
  const seen = new Map<string, number>()
  const waiters: (() => void)[] = []
  ws.on('message', (data: Buffer) => {
    messages.push(JSON.parse(data.toString()) as ServerMessage)
    waiters.splice(0).forEach((wake) => wake())
  })
  await once(ws, 'open')

  return {
    ws,
    messages,
    send: (msg) => ws.send(typeof msg === 'string' ? msg : JSON.stringify(msg)),
    async next(type) {
      for (;;) {
        const from = seen.get(type) ?? 0
        const index = messages.findIndex((m, i) => i >= from && m.type === type)
        if (index >= 0) {
          seen.set(type, index + 1)
          return messages[index] as never
        }
        await new Promise<void>((resolve) => waiters.push(resolve))
      }
    },
  }
}
