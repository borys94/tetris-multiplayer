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
import { guestName, type RoomStore } from "./rooms/room-store";
import type { RoomMember } from "./rooms/room";
import { log } from "./observability/logger";
import {
  gamesStarted,
  serverFull,
  wsConnections,
  wsErrors,
  wsMessages,
  wsRejected,
  wsSentBytes,
} from "./observability/metrics";

export interface WsOptions {
  store: SessionStore;
  /** Pokoje 1v1 (spec 007); bez nich wiadomości pokoi są błędem protokołu. */
  rooms?: RoomStore;
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
/** Serwer się restartuje (deploy): klient łączy się ponownie, już z nowym podem. */
const CLOSE_SERVICE_RESTART = 1012;
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
  private watchingRooms = false;
  private errors = 0;
  private readonly limiter: RateLimiter;
  alive = true;

  constructor(
    readonly ws: WebSocket,
    /** Zalogowany gracz tego połączenia; `null` to gość. */
    private readonly user: Pick<SessionUser, "id" | "username"> | null,
    private readonly store: SessionStore,
    private readonly options: WsOptions,
    private readonly sessionOwners: Map<string, Connection>,
  ) {
    this.limiter = new RateLimiter(options.messagesPerSecond, options.messageBurst);
  }

  send = (msg: ServerMessage): void => {
    if (this.ws.readyState !== WebSocket.OPEN) return;
    const data = JSON.stringify(msg);
    wsSentBytes.inc({ type: msg.type }, data.length);
    this.ws.send(data);
  };

  /** Czy gracz jest w trakcie meczu (takiego połączenia nie zamykamy przy deployu). */
  get inMatch(): boolean {
    const session = this.session;
    return session !== null && this.options.rooms?.roomOf(session.id)?.state === "playing";
  }

  receive(data: RawData, isBinary: boolean): void {
    wsMessages.inc();
    if (!this.limiter.take()) return this.fail("rate_limited");
    const msg = isBinary ? null : parseClientMessage(rawToString(data));
    if (!msg || !this.handle(msg)) return this.fail("invalid");
    this.errors = 0;
  }

  private get userId(): number | null {
    return this.user?.id ?? null;
  }

  close(): void {
    if (this.watchingRooms) this.options.rooms?.unwatch(this.send);
    const session = this.session;
    if (!session || this.sessionOwners.get(session.id) !== this) return;
    this.sessionOwners.delete(session.id);
    session.detach();
    this.store.markDetached(session);
    this.options.rooms?.detach(session.id);
  }

  private member(session: Session): RoomMember {
    return {
      sessionId: session.id,
      userId: this.userId,
      name: this.user?.username ?? guestName(session.id),
    };
  }

  /** Obsługuje poprawną składniowo wiadomość; `false` oznacza złamanie protokołu. */
  private handle(msg: ClientMessage): boolean {
    if (msg.type === "hello") return this.hello(msg);
    const session = this.session;
    if (!session) return false;
    const rooms = this.options.rooms;
    const room = rooms?.roomOf(session.id);

    switch (msg.type) {
      case "input":
        return room
          ? rooms!.input(session.id, msg.seq, msg.tick, msg.actions)
          : session.input(msg.seq, msg.tick, msg.actions);
      case "watchRooms":
        if (!rooms) return false;
        this.watchingRooms = true;
        rooms.watch(this.send);
        return true;
      case "unwatchRooms":
        this.watchingRooms = false;
        rooms?.unwatch(this.send);
        return true;
      case "createRoom":
      case "joinRoom": {
        if (!rooms) return false;
        // Gra singleplayer czeka wstrzymana, aż gracz wróci z pokoju.
        session.suspend();
        const error =
          msg.type === "createRoom"
            ? rooms.create(this.member(session), msg.visibility, this.send)
            : rooms.join(this.member(session), msg.code, this.send);
        if (error) this.send({ type: "error", code: error });
        return true;
      }
      case "leaveRoom":
        // Wyjście z już zamkniętego pokoju (np. założyciel wyszedł chwilę wcześniej) to nie błąd.
        if (!rooms) return false;
        rooms.leave(session.id);
        return true;
      case "ready":
        return rooms?.ready(session.id) ?? false;
    }

    // W pokoju nie ma singleplayera ani pauzy (spec 007).
    if (room) return false;
    switch (msg.type) {
      case "newGame":
        session.userId = this.userId;
        session.newGame(randomSeed());
        gamesStarted.inc();
        return true;
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
        serverFull.inc();
        this.send({ type: "error", code: "server_full" });
        this.ws.close(CLOSE_TRY_AGAIN, "server full");
        return true;
      }
      session.userId = this.userId;
      gamesStarted.inc();
    }

    this.session = session;
    this.sessionOwners.set(session.id, this);
    this.store.markAttached(session);
    this.send({ type: "welcome", sessionId: session.id, token: session.token });
    session.attach(this.send);
    this.options.rooms?.attach(session.id, this.send);
    return true;
  }

  private fail(code: ErrorCode): void {
    wsErrors.inc({ code });
    this.send({ type: "error", code });
    if (++this.errors >= MAX_CONSECUTIVE_ERRORS) this.ws.close(CLOSE_POLICY, code);
  }
}

function rawToString(data: RawData): string {
  if (Array.isArray(data)) return Buffer.concat(data).toString("utf8");
  return Buffer.from(data as ArrayBuffer).toString("utf8");
}

/** Wywołanie zamyka wszystkie połączenia; `drain()` przygotowuje serwer do deployu. */
export type WsHandle = (() => void) & {
  /**
   * Odrzuca nowe połączenia i zamyka te, które nie są w trwającym meczu (klient łączy się
   * ponownie, już z nowym podem). Wołane wielokrotnie zamyka połączenia graczy po końcu meczu.
   */
  drain(): void;
};

/**
 * Podpina endpoint `/ws` pod serwer HTTP (ten sam port co Express, ADR-0007).
 * Zwraca funkcję zamykającą wszystkie połączenia (np. przy SIGTERM) z metodą `drain`.
 */
export function attachWebSocket(server: Server, options: WsOptions): WsHandle {
  let draining = false;
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
    if (draining) {
      wsRejected.inc({ reason: "draining" });
      return reject(socket, 503, "Service Unavailable");
    }
    if (options.allowedOrigin && req.headers.origin !== options.allowedOrigin) {
      wsRejected.inc({ reason: "origin" });
      return reject(socket, 403, "Forbidden");
    }
    const ip = clientIp(req, options.trustProxy);
    const count = connectionsPerIp.get(ip) ?? 0;
    if (options.maxConnectionsPerIp > 0 && count >= options.maxConnectionsPerIp) {
      wsRejected.inc({ reason: "ip_limit" });
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
      log.error({ err: error }, "WebSocket auth error");
      return null;
    });
    if (socket.destroyed) return release();

    wss.handleUpgrade(req, socket, head, (ws) => {
      const connection = new Connection(
        ws,
        user ? { id: user.id, username: user.username } : null,
        options.store,
        options,
        sessionOwners,
      );
      connections.add(connection);
      wsConnections.inc();
      ws.on("message", (data, isBinary) => connection.receive(data, isBinary));
      ws.on("pong", () => (connection.alive = true));
      ws.on("error", () => ws.terminate());
      ws.on("close", () => {
        connections.delete(connection);
        wsConnections.dec();
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

  const close = () => {
    clearInterval(heartbeat);
    for (const connection of connections) connection.ws.close(CLOSE_GOING_AWAY, "shutdown");
    wss.close();
  };
  const drain = () => {
    draining = true;
    for (const connection of connections) {
      if (!connection.inMatch) connection.ws.close(CLOSE_SERVICE_RESTART, "restart");
    }
  };
  return Object.assign(close, { drain });
}
