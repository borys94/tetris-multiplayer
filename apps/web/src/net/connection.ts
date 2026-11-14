import {
  PROTOCOL_VERSION,
  parseServerMessage,
  type ClientMessage,
  type ServerMessage,
} from "@tetris/protocol";

export type ConnectionStatus = "connecting" | "online" | "offline" | "closed";

export interface ConnectionHandlers {
  onMessage(msg: ServerMessage): void;
  onStatus(status: ConnectionStatus): void;
}

/** Minimalny interfejs gniazda (podmieniany w testach). */
export interface SocketLike {
  readonly readyState: number;
  onopen: (() => void) | null;
  onmessage: ((event: { data: unknown }) => void) | null;
  onclose: ((event: { code: number }) => void) | null;
  send(data: string): void;
  close(): void;
}

export interface ConnectionDeps {
  createSocket(url: string): SocketLike;
  setTimeout(callback: () => void, ms: number): unknown;
  clearTimeout(handle: unknown): void;
  random(): number;
}

/** Kolejne opóźnienia ponownego łączenia (ms); ostatnie powtarzamy do skutku. */
export const RECONNECT_DELAYS_MS = [500, 1000, 2000, 4000, 8000] as const;
const OPEN = 1;
/** Kody zamknięcia, po których nie łączymy się ponownie (sesję przejęła inna karta, zła wersja). */
const FINAL_CLOSE_CODES = new Set([4000, 1008]);

const browserDeps: ConnectionDeps = {
  createSocket: (url) => new WebSocket(url) as unknown as SocketLike,
  setTimeout: (callback, ms) => window.setTimeout(callback, ms),
  clearTimeout: (handle) => window.clearTimeout(handle as number),
  random: Math.random,
};

export function defaultServerUrl(location: Location): string {
  return `${location.protocol === "https:" ? "wss" : "ws"}://${location.host}/ws`;
}

/**
 * Połączenie z serwerem gry: `hello`, wznawianie sesji po zerwaniu i reconnect
 * z wykładniczym backoffem i jitterem (spec 004).
 */
export class Connection {
  private socket: SocketLike | null = null;
  private session: { sessionId: string; token: string } | null = null;
  private attempt = 0;
  private timer: unknown = null;
  private stopped = false;

  constructor(
    private readonly url: string,
    private readonly handlers: ConnectionHandlers,
    private readonly deps: ConnectionDeps = browserDeps,
  ) {}

  start(): void {
    this.stopped = false;
    this.open();
  }

  stop(): void {
    this.stopped = true;
    if (this.timer !== null) this.deps.clearTimeout(this.timer);
    this.socket?.close();
    this.socket = null;
  }

  /** Wysyła wiadomość; zwraca `false`, gdy połączenie nie jest otwarte. */
  send(msg: ClientMessage): boolean {
    if (this.socket?.readyState !== OPEN) return false;
    this.socket.send(JSON.stringify(msg));
    return true;
  }

  private open(): void {
    this.timer = null;
    this.handlers.onStatus("connecting");
    const socket = this.deps.createSocket(this.url);
    this.socket = socket;

    socket.onopen = () => this.hello();
    socket.onmessage = (event) => {
      const msg = typeof event.data === "string" ? parseServerMessage(event.data) : null;
      if (!msg) return;
      if (msg.type === "welcome") {
        this.session = { sessionId: msg.sessionId, token: msg.token };
        this.attempt = 0;
        this.handlers.onStatus("online");
      } else if (msg.type === "error" && msg.code === "session_expired") {
        this.session = null;
        this.hello();
      }
      this.handlers.onMessage(msg);
    };
    socket.onclose = (event) => {
      if (this.socket !== socket) return;
      this.socket = null;
      if (this.stopped || FINAL_CLOSE_CODES.has(event.code)) {
        this.handlers.onStatus("closed");
        return;
      }
      this.handlers.onStatus("offline");
      this.timer = this.deps.setTimeout(() => this.open(), this.nextDelay());
    };
  }

  private hello(): void {
    this.send({
      type: "hello",
      protocol: PROTOCOL_VERSION,
      ...(this.session ? { resume: this.session } : {}),
    });
  }

  /** Opóźnienie z jitterem ±20%, żeby klienci po awarii serwera nie wracali naraz. */
  private nextDelay(): number {
    const base = RECONNECT_DELAYS_MS[Math.min(this.attempt, RECONNECT_DELAYS_MS.length - 1)]!;
    this.attempt++;
    return Math.round(base * (0.8 + 0.4 * this.deps.random()));
  }
}
