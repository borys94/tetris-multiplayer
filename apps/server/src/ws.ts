import type { IncomingMessage, Server } from "node:http";
import type { Duplex } from "node:stream";
import {
  MAX_MESSAGE_BYTES,
  PROTOCOL_VERSION,
  parseClientMessage,
  type ClientMessage,
  type ErrorCode,
  type ServerMessage,
} from "@tetris/protocol";
import { WebSocket, WebSocketServer, type RawData } from "ws";
import { randomSeed, type SessionStore } from "./game/session-store";
import type { Session } from "./game/session";
import type { SessionUser } from "./db/sessions";

export interface WsOptions {
  store: SessionStore;
  /** Dozwolony nagłówek `Origin`, np. `https://example.com`; bez niego nie sprawdzamy (dev). */
  allowedOrigin?: string;
  /** Czy brać IP klienta z `X-Forwarded-For` (za Traefikiem). */
  trustProxy: boolean;
  /** Limit połączeń z jednego IP; 0 wyłącza limit (np. gdy proxy nie przekazuje IP klienta). */
  maxConnectionsPerIp: number;
  /** Limit wiadomości: średnio na sekundę i maksymalny chwilowy zapas. */
  messagesPerSecond: number;
  messageBurst: number;
  heartbeatMs: number;
  /** Użytkownik z cookie sesji (spec 005); bez niego wszyscy grają jako goście. */
  authenticate?: (req: IncomingMessage) => Promise<SessionUser | null>;
}

export const WS_PATH = "/ws";
/** Tyle błędnych wiadomości z rzędu zamyka połączenie (S3). */
const MAX_CONSECUTIVE_ERRORS = 3;

const CLOSE_POLICY = 1008;
const CLOSE_TRY_AGAIN = 1013;
const CLOSE_GOING_AWAY = 1001;
/** Sesję przejęło nowe połączenie (np. druga karta). */
const CLOSE_REPLACED = 4000;

function clientIp(req: IncomingMessage, trustProxy: boolean): string {
  const forwarded = req.headers["x-forwarded-for"];
  if (trustProxy && typeof forwarded === "string") {
    // Traefik dopisuje adres klienta na końcu listy; wcześniejsze wpisy może podać sam klient.
    const last = forwarded.split(",").at(-1)?.trim();
    if (last) return last;
  }
  return req.socket.remoteAddress ?? "unknown";
}

function reject(socket: Duplex, status: number, reason: string): void {
  socket.end(`HTTP/1.1 ${status} ${reason}\r\nConnection: close\r\n\r\n`);
}

/** Token bucket: `take()` zwraca `false`, gdy klient przekroczył limit. */
class RateLimiter {
  private tokens: number;
  private last = performance.now();

  constructor(
    private readonly perSecond: number,
    private readonly burst: number,
  ) {
    this.tokens = burst;
  }

  take(): boolean {
    const now = performance.now();
    this.tokens = Math.min(this.burst, this.tokens + ((now - this.last) / 1000) * this.perSecond);
    this.last = now;
    if (this.tokens < 1) return false;
    this.tokens--;
    return true;
  }
}

/** Jedno połączenie WebSocket: protokół, limity i przypięta sesja. */
class Connection {
  private session: Session | null = null;
  private errors = 0;
  private readonly limiter: RateLimiter;
  alive = true;

  constructor(
    readonly ws: WebSocket,
    /** Zalogowany gracz tego połączenia; `null` to gość. */
    private readonly userId: number | null,
    private readonly store: SessionStore,
    options: WsOptions,
    private readonly sessionOwners: Map<string, Connection>,
  ) {
    this.limiter = new RateLimiter(options.messagesPerSecond, options.messageBurst);
  }

  send = (msg: ServerMessage): void => {
    if (this.ws.readyState === WebSocket.OPEN) this.ws.send(JSON.stringify(msg));
  };

  receive(data: RawData, isBinary: boolean): void {
    if (!this.limiter.take()) return this.fail("rate_limited");
    const msg = isBinary ? null : parseClientMessage(rawToString(data));
    if (!msg || !this.handle(msg)) return this.fail("invalid");
    this.errors = 0;
  }

  close(): void {
    const session = this.session;
    if (!session || this.sessionOwners.get(session.id) !== this) return;
    this.sessionOwners.delete(session.id);
    session.detach();
    this.store.markDetached(session);
  }

  /** Obsługuje poprawną składniowo wiadomość; `false` oznacza złamanie protokołu. */
  private handle(msg: ClientMessage): boolean {
    if (msg.type === "hello") return this.hello(msg);
    const session = this.session;
    if (!session) return false;

    switch (msg.type) {
      case "newGame":
        session.userId = this.userId;
        session.newGame(randomSeed());
        return true;
      case "input":
        return session.input(msg.seq, msg.tick, msg.actions);
      case "pause":
        session.pause(msg.tick);
        return true;
      case "resume":
        session.resume();
        return true;
    }
  }

  private hello(msg: Extract<ClientMessage, { type: "hello" }>): boolean {
    if (this.session) return false;
    if (msg.protocol !== PROTOCOL_VERSION) {
      this.send({ type: "error", code: "version" });
      this.ws.close(CLOSE_POLICY, "version");
      return true;
    }

    let session: Session | null;
    if (msg.resume) {
      session = this.store.find(msg.resume.sessionId, msg.resume.token);
      if (!session) {
        // Klient zaczyna wtedy od nowa wiadomością `hello` bez `resume`.
        this.send({ type: "error", code: "session_expired" });
        return true;
      }
      const previous = this.sessionOwners.get(session.id);
      if (previous) {
        previous.session = null;
        session.detach();
        previous.ws.close(CLOSE_REPLACED, "replaced");
      }
    } else {
      session = this.store.create();
      if (!session) {
        this.send({ type: "error", code: "server_full" });
        this.ws.close(CLOSE_TRY_AGAIN, "server full");
        return true;
      }
      session.userId = this.userId;
    }

    this.session = session;
    this.sessionOwners.set(session.id, this);
    this.store.markAttached(session);
    this.send({ type: "welcome", sessionId: session.id, token: session.token });
    session.attach(this.send);
    return true;
  }

  private fail(code: ErrorCode): void {
    this.send({ type: "error", code });
    if (++this.errors >= MAX_CONSECUTIVE_ERRORS) this.ws.close(CLOSE_POLICY, code);
  }
}

function rawToString(data: RawData): string {
  if (Array.isArray(data)) return Buffer.concat(data).toString("utf8");
  return Buffer.from(data as ArrayBuffer).toString("utf8");
}

/**
 * Podpina endpoint `/ws` pod serwer HTTP (ten sam port co Express, ADR-0007).
 * Zwraca funkcję zamykającą wszystkie połączenia (np. przy SIGTERM).
 */
export function attachWebSocket(server: Server, options: WsOptions): () => void {
  const wss = new WebSocketServer({ noServer: true, maxPayload: MAX_MESSAGE_BYTES });
  const connectionsPerIp = new Map<string, number>();
  const sessionOwners = new Map<string, Connection>();
  const connections = new Set<Connection>();

  server.on("upgrade", (req: IncomingMessage, socket: Duplex, head: Buffer) => {
    void upgrade(req, socket, head);
  });

  async function upgrade(req: IncomingMessage, socket: Duplex, head: Buffer): Promise<void> {
    const path = new URL(req.url ?? "/", "http://localhost").pathname;
    if (path !== WS_PATH) return reject(socket, 404, "Not Found");
    if (options.allowedOrigin && req.headers.origin !== options.allowedOrigin) {
      return reject(socket, 403, "Forbidden");
    }
    const ip = clientIp(req, options.trustProxy);
    const count = connectionsPerIp.get(ip) ?? 0;
    if (options.maxConnectionsPerIp > 0 && count >= options.maxConnectionsPerIp) {
      return reject(socket, 429, "Too Many Requests");
    }

    connectionsPerIp.set(ip, count + 1);
    const release = () => {
      const left = (connectionsPerIp.get(ip) ?? 1) - 1;
      if (left > 0) connectionsPerIp.set(ip, left);
      else connectionsPerIp.delete(ip);
    };
    // Błąd bazy przy odczycie sesji nie blokuje gry: gracz gra wtedy jako gość.
    const user = await options.authenticate?.(req).catch((error: unknown) => {
      console.error("WebSocket auth error", error);
      return null;
    });
    if (socket.destroyed) return release();

    wss.handleUpgrade(req, socket, head, (ws) => {
      const connection = new Connection(
        ws,
        user?.id ?? null,
        options.store,
        options,
        sessionOwners,
      );
      connections.add(connection);
      ws.on("message", (data, isBinary) => connection.receive(data, isBinary));
      ws.on("pong", () => (connection.alive = true));
      ws.on("error", () => ws.terminate());
      ws.on("close", () => {
        connections.delete(connection);
        connection.close();
        release();
      });
    });
  }

  // Heartbeat: połączenie, które nie odpowiedziało na poprzedni ping, zamykamy.
  const heartbeat = setInterval(() => {
    for (const connection of connections) {
      if (!connection.alive) {
        connection.ws.terminate();
        continue;
      }
      connection.alive = false;
      connection.ws.ping();
    }
  }, options.heartbeatMs);

  return () => {
    clearInterval(heartbeat);
    for (const connection of connections) connection.ws.close(CLOSE_GOING_AWAY, "shutdown");
    wss.close();
  };
}
