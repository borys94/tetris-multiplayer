import type { ClientMessage, ServerMessage } from "@tetris/protocol";
import {
  createContext,
  useContext,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  Connection,
  defaultServerUrl,
  type ConnectionHandlers,
  type ConnectionStatus,
} from "./connection";

/** Połączenie z serwerem gry widziane przez komponenty (podmieniane w testach). */
export interface GameServer {
  send(msg: ClientMessage): boolean;
  stop(): void;
}

export type ConnectFn = (handlers: ConnectionHandlers) => GameServer;

export const connectToServer: ConnectFn = (handlers) => {
  const connection = new Connection(defaultServerUrl(window.location), handlers);
  connection.start();
  return connection;
};

type Listener = (msg: ServerMessage) => void;

export interface ServerApi {
  status: ConnectionStatus;
  send: (msg: ClientMessage) => boolean;
  /** Słuchacz wszystkich wiadomości serwera; zwraca funkcję wypisującą. */
  subscribe: (listener: Listener) => () => void;
}

const ServerContext = createContext<ServerApi | null>(null);

/**
 * Jedno połączenie WebSocket dla gry singleplayer i pokoi 1v1 (spec 007): pokój jest
 * przypięty do sesji gry, więc oba widoki muszą mówić przez tę samą sesję.
 * Komponenty zapisują się w swoich efektach, a te działają przed efektem providera,
 * więc żadna wiadomość wysłana zaraz po połączeniu nie przepada.
 */
export function ServerProvider({
  connect = connectToServer,
  children,
}: {
  connect?: ConnectFn | undefined;
  children: ReactNode;
}) {
  const listeners = useRef(new Set<Listener>());
  const server = useRef<GameServer | null>(null);
  const [status, setStatus] = useState<ConnectionStatus>("connecting");

  useEffect(() => {
    const connection = connect({
      onMessage: (msg) => listeners.current.forEach((listener) => listener(msg)),
      onStatus: setStatus,
    });
    server.current = connection;
    return () => {
      connection.stop();
      server.current = null;
    };
  }, [connect]);

  const [api] = useState(() => ({
    send: (msg: ClientMessage) => server.current?.send(msg) ?? false,
    subscribe: (listener: Listener) => {
      listeners.current.add(listener);
      return () => void listeners.current.delete(listener);
    },
  }));

  return <ServerContext.Provider value={{ ...api, status }}>{children}</ServerContext.Provider>;
}

export function useServer(): ServerApi {
  const server = useContext(ServerContext);
  if (!server) throw new Error("useServer poza ServerProvider");
  return server;
}

/** Zapisuje `listener` na wiadomości serwera na czas życia komponentu. */
export function useServerMessages(listener: Listener): void {
  const { subscribe } = useServer();
  const latest = useRef(listener);
  useLayoutEffect(() => {
    latest.current = listener;
  });
  useEffect(() => subscribe((msg) => latest.current(msg)), [subscribe]);
}
