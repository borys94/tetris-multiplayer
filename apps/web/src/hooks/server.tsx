import type { ClientMessage, ServerMessage } from '@tetris/protocol'
import {
  createContext,
  useContext,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import type { ConnectionStatus } from '../core/net/connection'
import { connectToServer, type ConnectFn, type GameServer } from '../core/net/game-server'

type Listener = (msg: ServerMessage) => void

export interface ServerApi {
  status: ConnectionStatus
  send: (msg: ClientMessage) => boolean
  /** Słuchacz wszystkich wiadomości serwera; zwraca funkcję wypisującą. */
  subscribe: (listener: Listener) => () => void
}

const ServerContext = createContext<ServerApi | null>(null)

/**
 * Jedno połączenie WebSocket dla gry singleplayer i pokoi 1v1 (spec siec-protokol): pokój jest
 * przypięty do sesji gry, więc oba widoki muszą mówić przez tę samą sesję.
 * Komponenty zapisują się w swoich efektach, a te działają przed efektem providera,
 * więc żadna wiadomość wysłana zaraz po połączeniu nie przepada.
 */
export const ServerProvider = ({
  connect = connectToServer,
  children,
}: {
  connect?: ConnectFn | undefined
  children: ReactNode
}) => {
  const listeners = useRef(new Set<Listener>())
  const server = useRef<GameServer | null>(null)
  const [status, setStatus] = useState<ConnectionStatus>('connecting')

  useEffect(() => {
    const connection = connect({
      onMessage: (msg) => listeners.current.forEach((listener) => listener(msg)),
      onStatus: setStatus,
    })
    server.current = connection
    return () => {
      connection.stop()
      server.current = null
    }
  }, [connect])

  const [api] = useState(() => ({
    send: (msg: ClientMessage) => server.current?.send(msg) ?? false,
    subscribe: (listener: Listener) => {
      listeners.current.add(listener)
      return () => void listeners.current.delete(listener)
    },
  }))

  return <ServerContext.Provider value={{ ...api, status }}>{children}</ServerContext.Provider>
}

export const useServer = (): ServerApi => {
  const server = useContext(ServerContext)
  if (!server) {
    throw new Error('useServer poza ServerProvider')
  }
  return server
}

/** Zapisuje `listener` na wiadomości serwera na czas życia komponentu. */
export const useServerMessages = (listener: Listener): void => {
  const { subscribe } = useServer()
  const latest = useRef(listener)
  useLayoutEffect(() => {
    latest.current = listener
  })
  useEffect(() => subscribe((msg) => latest.current(msg)), [subscribe])
}
