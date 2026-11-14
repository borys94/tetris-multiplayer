import {
  TICKS_PER_SECOND,
  createGame,
  randomHole,
  receiveGarbage,
  type Action,
} from "@tetris/game-core";
import {
  COUNTDOWN_MS,
  SNAPSHOT_INTERVAL_TICKS,
  type MatchEndReason,
  type OpponentView,
  type RoomPlayer,
  type RoomState,
  type RoomVisibility,
} from "@tetris/protocol";
import { BufferedGame } from "../game/buffered-game";
import { randomSeed } from "../game/session-store";
import type { Send } from "../game/session";

/** Gracz w pokoju: jego sesja gry (do wznowienia), konto i nazwa. */
export interface RoomMember {
  sessionId: string;
  /** `null` to gość. */
  userId: number | null;
  name: string;
}

interface Player extends RoomMember {
  send: Send | null;
  ready: boolean;
  /** Kiedy gracz stracił połączenie (ms); `null`, gdy jest połączony. */
  disconnectedAt: number | null;
  /** Gra w trwającym lub ostatnim meczu. */
  game: BufferedGame | null;
  /** Ile z `linesSent` gracza dostarczyliśmy już przeciwnikowi. */
  delivered: number;
}

export interface MatchResult {
  winner: RoomMember;
  loser: RoomMember;
  /** Dlaczego przegrany przegrał. */
  reason: MatchEndReason;
  winnerLinesSent: number;
  loserLinesSent: number;
  ticks: number;
}

export interface RoomOptions {
  bufferTicks: number;
  maxAheadTicks: number;
  /** Jak długo rozłączony gracz może wrócić (ms); potem opuszcza pokój, a w meczu przegrywa. */
  ttlMs: number;
}

/** Stan pokoju dla panelu admina (spec 007, R5). */
export interface RoomInfo {
  code: string;
  visibility: RoomVisibility;
  state: RoomState;
  host: string;
  createdAt: number;
  players: { name: string; userId: number | null; connected: boolean }[];
  match: {
    seconds: number;
    players: { name: string; score: number; lines: number; linesSent: number }[];
  } | null;
}

/** Liczba graczy w pokoju 1v1; w M8 stanie się parametrem pokoju. */
export const ROOM_CAPACITY = 2;

function opponentView(game: BufferedGame): OpponentView {
  const { board, active, garbage, score, lines, linesSent, status } = game.game;
  return { board, active, garbage, score, lines, linesSent, status };
}

/**
 * Pokój meczu 1v1 (spec 007, ADR-0010): poczekalnia z gotowością, odliczanie
 * i mecz liczony we wspólnym zegarze. Gracze grają tym samym seedem, bez pauzy;
 * linie wysłane przez gracza trafiają do kolejki przeciwnika na tym samym ticku.
 * Założyciel jest zawsze pierwszy na liście; jego wyjście zamyka pokój.
 */
export class Room {
  private _state: RoomState = "waiting";
  private readonly players: Player[] = [];
  private startsAt: number | null = null;
  private clock = 0;
  private simTick = 0;
  private holeRng = 0;
  private closed = false;

  /** Koniec meczu (np. zapis wyniku). */
  onMatchEnd: ((result: MatchResult) => void) | null = null;
  /** Gracz opuścił pokój (sam, po wygaśnięciu lub przez zamknięcie pokoju). */
  onLeave: ((sessionId: string) => void) | null = null;
  /** Zmiana widoczna na liście pokoi publicznych albo zamknięcie pokoju. */
  onChange: (() => void) | null = null;

  constructor(
    readonly code: string,
    readonly visibility: RoomVisibility,
    readonly createdAt: number,
    private readonly options: RoomOptions,
    private readonly now: () => number,
  ) {}

  get state(): RoomState {
    return this._state;
  }

  get isClosed(): boolean {
    return this.closed;
  }

  get size(): number {
    return this.players.length;
  }

  get host(): RoomMember | undefined {
    return this.players[0];
  }

  /** Czy ktoś może dołączyć (pokój czeka i ma wolne miejsce). */
  get open(): boolean {
    return !this.closed && this._state === "waiting" && this.players.length < ROOM_CAPACITY;
  }

  has(sessionId: string): boolean {
    return this.players.some((p) => p.sessionId === sessionId);
  }

  hasUser(userId: number): boolean {
    return this.players.some((p) => p.userId === userId);
  }

  join(member: RoomMember, send: Send): void {
    this.players.push({
      ...member,
      send,
      ready: false,
      disconnectedAt: null,
      game: null,
      delivered: 0,
    });
    this.broadcastRoom();
    this.onChange?.();
  }

  /** Gracz wychodzi: w meczu przegrywa walkowerem, a wyjście założyciela zamyka pokój. */
  leave(sessionId: string, reason: MatchEndReason = "left"): void {
    const player = this.find(sessionId);
    if (!player) return;
    if (this._state === "playing") this.finish(this.opponentOf(player)!, player, reason);

    if (player === this.players[0]) {
      this.close();
      return;
    }
    this.players.splice(this.players.indexOf(player), 1);
    this.onLeave?.(player.sessionId);
    player.send?.({ type: "roomClosed" });
    this.backToWaiting();
    this.broadcastRoom();
    this.onChange?.();
  }

  /** Zamyka pokój i wyprasza wszystkich graczy. */
  close(): void {
    if (this.closed) return;
    this.closed = true;
    for (const player of this.players) {
      this.onLeave?.(player.sessionId);
      player.send?.({ type: "roomClosed" });
    }
    this.players.length = 0;
    this.onChange?.();
  }

  /** Gotowość do meczu lub rewanżu; `false`, gdy w tym stanie pokoju nie ma sensu (protokół). */
  ready(sessionId: string): boolean {
    const player = this.find(sessionId);
    if (!player || (this._state !== "waiting" && this._state !== "finished")) return false;
    player.ready = true;
    if (this.players.length === ROOM_CAPACITY && this.players.every((p) => p.ready)) {
      this._state = "countdown";
      this.startsAt = this.now() + COUNTDOWN_MS;
    }
    this.broadcastRoom();
    this.onChange?.();
    return true;
  }

  input(sessionId: string, seq: number, clientTick: number, actions: readonly Action[]): boolean {
    const game = this.find(sessionId)?.game;
    // Akcje spóźnione po końcu meczu ignorujemy; przed startem to błąd protokołu.
    if (this._state === "finished") return true;
    if (this._state !== "playing" || !game) return false;
    return game.accept(seq, clientTick, actions, this.clock + this.options.maxAheadTicks);
  }

  /** Nowe połączenie gracza: dostaje stan pokoju, a w trakcie meczu cały stan gry. */
  attach(sessionId: string, send: Send): void {
    const player = this.find(sessionId);
    if (!player) return;
    player.send = send;
    player.disconnectedAt = null;
    this.broadcastRoom();
    if (this._state === "playing" && player.game) {
      player.game.resetInputs();
      this.sendMatch(player);
    }
  }

  /** Rozłączenie nie pauzuje meczu: plansza gracza dalej opada (R4). */
  detach(sessionId: string): void {
    const player = this.find(sessionId);
    if (!player) return;
    player.send = null;
    player.disconnectedAt = this.now();
    this.broadcastRoom();
  }

  /** Przesuwa pokój o `ticks` ticków: wygasanie rozłączonych, start po odliczaniu, mecz. */
  advance(ticks: number): void {
    const now = this.now();
    for (const player of [...this.players]) {
      if (player.disconnectedAt !== null && now - player.disconnectedAt >= this.options.ttlMs) {
        this.leave(player.sessionId, "timeout");
      }
    }
    if (this.closed) return;

    if (this._state === "countdown" && this.startsAt !== null && now >= this.startsAt) {
      this.startMatch();
    }
    if (this._state !== "playing") return;
    for (let i = 0; i < ticks && this._state === "playing"; i++) {
      this.clock++;
      while (this._state === "playing" && this.simTick < this.clock - this.options.bufferTicks) {
        this.step();
      }
    }
  }

  info(): RoomInfo {
    const playing = this._state === "playing";
    return {
      code: this.code,
      visibility: this.visibility,
      state: this._state,
      host: this.players[0]?.name ?? "",
      createdAt: this.createdAt,
      players: this.players.map((p) => ({
        name: p.name,
        userId: p.userId,
        connected: p.send !== null,
      })),
      match: playing
        ? {
            seconds: Math.floor(this.simTick / TICKS_PER_SECOND),
            players: this.players.map((p) => ({
              name: p.name,
              score: p.game?.game.score ?? 0,
              lines: p.game?.game.lines ?? 0,
              linesSent: p.game?.game.linesSent ?? 0,
            })),
          }
        : null,
    };
  }

  private startMatch(): void {
    const seed = randomSeed();
    this._state = "playing";
    this.startsAt = null;
    this.clock = 0;
    this.simTick = 0;
    this.holeRng = randomSeed();
    for (const player of this.players) {
      player.ready = false;
      player.delivered = 0;
      player.game = new BufferedGame(createGame(seed));
    }
    this.broadcastRoom();
    for (const player of this.players) this.sendMatch(player);
    this.onChange?.();
  }

  /** Jeden tick symulacji wszystkich graczy w stałej kolejności (kolejność dołączenia). */
  private step(): void {
    for (const player of this.players) {
      const game = player.game!;
      game.step();
      this.deliverGarbage(player);
      if (game.over) {
        this.finish(this.opponentOf(player)!, player, "topout");
        return;
      }
    }
    this.simTick++;
    if (this.simTick % SNAPSHOT_INTERVAL_TICKS === 0) this.sendSnapshots();
  }

  /** Linie wysłane przez gracza od ostatniego ticka trafiają jedną paczką do przeciwnika. */
  private deliverGarbage(player: Player): void {
    const sent = player.game!.game.linesSent - player.delivered;
    const target = this.opponentOf(player)?.game;
    if (sent <= 0 || !target) return;
    const { hole, rng } = randomHole(this.holeRng);
    this.holeRng = rng;
    target.game = receiveGarbage(target.game, { lines: sent, hole });
    player.delivered += sent;
  }

  private finish(winner: Player, loser: Player, reason: MatchEndReason): void {
    this._state = "finished";
    this.sendSnapshots();
    for (const player of this.players) {
      player.send?.({ type: "result", won: player === winner, winner: winner.name, reason });
    }
    this.onMatchEnd?.({
      winner: { sessionId: winner.sessionId, userId: winner.userId, name: winner.name },
      loser: { sessionId: loser.sessionId, userId: loser.userId, name: loser.name },
      reason,
      winnerLinesSent: winner.game?.game.linesSent ?? 0,
      loserLinesSent: loser.game?.game.linesSent ?? 0,
      ticks: this.simTick,
    });
    this.broadcastRoom();
    this.onChange?.();
  }

  /** Po wyjściu przeciwnika pokój znów czeka na drugiego gracza. */
  private backToWaiting(): void {
    if (this._state === "playing") return;
    this._state = "waiting";
    this.startsAt = null;
    for (const player of this.players) player.ready = false;
  }

  private sendMatch(player: Player): void {
    const opponent = this.opponentOf(player)?.game;
    if (!player.game || !opponent) return;
    player.send?.({
      type: "match",
      tick: this.simTick,
      state: player.game.game,
      opponent: opponentView(opponent),
    });
  }

  private sendSnapshots(): void {
    for (const player of this.players) {
      const opponent = this.opponentOf(player)?.game;
      if (!player.game || !opponent) continue;
      player.send?.({
        type: "matchSnapshot",
        tick: this.simTick,
        ackSeq: player.game.ackSeq,
        state: player.game.game,
        opponent: opponentView(opponent),
      });
    }
  }

  private broadcastRoom(): void {
    const players: RoomPlayer[] = this.players.map((p, index) => ({
      name: p.name,
      host: index === 0,
      ready: p.ready,
      connected: p.send !== null,
    }));
    for (const [you, player] of this.players.entries()) {
      player.send?.({
        type: "room",
        code: this.code,
        visibility: this.visibility,
        state: this._state,
        players,
        you,
        ...(this.startsAt !== null ? { startsAt: this.startsAt } : {}),
      });
    }
  }

  private find(sessionId: string): Player | undefined {
    return this.players.find((p) => p.sessionId === sessionId);
  }

  private opponentOf(player: Player): Player | undefined {
    return this.players.find((p) => p !== player);
  }
}
