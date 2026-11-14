import { randomInt } from "node:crypto";
import type { Action } from "@tetris/game-core";
import {
  ROOM_CODE_ALPHABET,
  ROOM_CODE_LENGTH,
  type ErrorCode,
  type RoomState,
  type RoomSummary,
  type RoomVisibility,
} from "@tetris/protocol";
import type { Send } from "../game/send";
import { Room, type MatchResult, type RoomInfo, type RoomMember, type RoomOptions } from "./room";

export interface RoomStoreOptions extends RoomOptions {
  maxRooms: number;
  /** Koniec meczu w dowolnym pokoju (np. zapis wyniku). */
  onMatchEnd?: (result: MatchResult) => void;
}

export type RoomError = Extract<
  ErrorCode,
  "room_not_found" | "room_full" | "room_limit" | "login_required" | "server_full"
>;

const ROOM_STATES: readonly RoomState[] = ["waiting", "countdown", "playing", "finished"];
const VISIBILITIES: readonly RoomVisibility[] = ["public", "private"];

/** Nazwa gościa w pokoju: stała dla sesji gry, więc nie zmienia się po wznowieniu. */
export function guestName(sessionId: string): string {
  let hash = 0;
  for (const char of sessionId) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  return `Gość-${String(hash % 10_000).padStart(4, "0")}`;
}

function randomCode(): string {
  return Array.from(
    { length: ROOM_CODE_LENGTH },
    () => ROOM_CODE_ALPHABET[randomInt(ROOM_CODE_ALPHABET.length)],
  ).join("");
}

/** Zalogowany ma jeden pokój na konto (także w kilku kartach), gość na sesję gry (spec 007). */
function ownerKey(member: RoomMember): string {
  return member.userId !== null ? `user:${member.userId}` : `session:${member.sessionId}`;
}

/**
 * Pokoje w pamięci procesu (spec 007): zakładanie, dołączanie, lista publicznych
 * dla obserwujących. Czas przesuwa wspólna pętla gry (`play/loop`).
 */
export class RoomStore {
  private readonly rooms = new Map<string, Room>();
  private readonly bySession = new Map<string, Room>();
  private readonly byOwner = new Map<string, Room>();
  private readonly watchers = new Set<Send>();
  private lastList = "";
  private listDirty = false;
  private draining = false;

  constructor(
    private readonly options: RoomStoreOptions,
    private readonly now: () => number = Date.now,
    private readonly newCode: () => string = randomCode,
  ) {}

  get size(): number {
    return this.rooms.size;
  }

  roomOf(sessionId: string): Room | undefined {
    return this.bySession.get(sessionId);
  }

  /** Liczba trwających meczów (przy deployu czekamy, aż spadnie do zera). */
  get playing(): number {
    return [...this.rooms.values()].filter((room) => room.state === "playing").length;
  }

  /**
   * Deploy (spec 007): stary pod nie przyjmuje nowych pokoi i graczy, zamyka pokoje bez
   * trwającego meczu, a pokoje z meczem zamyka zaraz po jego końcu (bez rewanżu na starym podzie).
   */
  drain(): void {
    this.draining = true;
    this.closeIdleRooms();
  }

  /** Nowy pokój z założycielem w środku albo kod błędu. */
  create(member: RoomMember, visibility: RoomVisibility, send: Send): RoomError | null {
    if (this.draining) return "server_full";
    if (visibility === "private" && member.userId === null) return "login_required";
    if (this.bySession.has(member.sessionId) || this.byOwner.has(ownerKey(member))) {
      return "room_limit";
    }
    if (this.rooms.size >= this.options.maxRooms) return "server_full";

    let code = this.newCode();
    while (this.rooms.has(code)) code = this.newCode();
    const room = new Room(code, visibility, this.now(), this.options, this.now);
    room.onChange = () => {
      if (room.isClosed) this.remove(room);
      this.listDirty = true;
    };
    room.onLeave = (sessionId) => this.bySession.delete(sessionId);
    room.onMatchEnd = (result) => this.options.onMatchEnd?.(result);
    this.rooms.set(code, room);
    this.byOwner.set(ownerKey(member), room);
    this.bySession.set(member.sessionId, room);
    room.join(member, send);
    this.publishList();
    return null;
  }

  join(member: RoomMember, code: string, send: Send): RoomError | null {
    if (this.draining) return "server_full";
    if (this.bySession.has(member.sessionId)) return "room_limit";
    const room = this.rooms.get(code);
    if (!room || room.isClosed) return "room_not_found";
    // Ten sam gracz w dwóch kartach nie gra sam ze sobą.
    if (!room.open || (member.userId !== null && room.hasUser(member.userId))) return "room_full";

    this.bySession.set(member.sessionId, room);
    room.join(member, send);
    this.publishList();
    return null;
  }

  /** Wyjście z pokoju; `false`, gdy gracz nie jest w żadnym. */
  leave(sessionId: string): boolean {
    const room = this.bySession.get(sessionId);
    if (!room) return false;
    room.leave(sessionId);
    this.publishList();
    return true;
  }

  ready(sessionId: string): boolean {
    return this.bySession.get(sessionId)?.ready(sessionId) ?? false;
  }

  input(sessionId: string, seq: number, tick: number, actions: readonly Action[]): boolean {
    return this.bySession.get(sessionId)?.input(sessionId, seq, tick, actions) ?? false;
  }

  attach(sessionId: string, send: Send): void {
    this.bySession.get(sessionId)?.attach(sessionId, send);
  }

  detach(sessionId: string): void {
    this.bySession.get(sessionId)?.detach(sessionId);
  }

  /** Subskrypcja listy pokoi publicznych: od razu bieżąca lista, potem każda zmiana. */
  watch(send: Send): void {
    this.watchers.add(send);
    send({ type: "rooms", rooms: this.publicRooms() });
  }

  unwatch(send: Send): void {
    this.watchers.delete(send);
  }

  /** Pokoje publiczne, do których można dołączyć, od najstarszego. */
  publicRooms(): RoomSummary[] {
    return [...this.rooms.values()]
      .filter((room) => room.visibility === "public" && room.open)
      .map((room) => ({ code: room.code, host: room.host?.name ?? "", createdAt: room.createdAt }));
  }

  /** Wszystkie pokoje dla panelu admina, od najstarszego. */
  list(): RoomInfo[] {
    return [...this.rooms.values()].map((room) => room.info());
  }

  advance(ticks: number): void {
    for (const room of [...this.rooms.values()]) room.advance(ticks);
    if (this.draining) this.closeIdleRooms();
    if (this.listDirty) this.publishList();
  }

  /** Liczba pokoi według stanu i widoczności (metryka `blockfall_rooms`). */
  countByState(): { state: RoomState; visibility: RoomVisibility; count: number }[] {
    const counts = new Map<string, number>();
    for (const room of this.rooms.values()) {
      const key = `${room.state}/${room.visibility}`;
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
    return ROOM_STATES.flatMap((state) =>
      VISIBILITIES.map((visibility) => ({
        state,
        visibility,
        count: counts.get(`${state}/${visibility}`) ?? 0,
      })),
    );
  }

  private closeIdleRooms(): void {
    for (const room of [...this.rooms.values()]) if (room.state !== "playing") room.close();
  }

  private remove(room: Room): void {
    this.rooms.delete(room.code);
    for (const [key, owned] of this.byOwner) if (owned === room) this.byOwner.delete(key);
  }

  private publishList(): void {
    this.listDirty = false;
    const rooms = this.publicRooms();
    const serialized = JSON.stringify(rooms);
    if (serialized === this.lastList) return;
    this.lastList = serialized;
    for (const send of this.watchers) send({ type: "rooms", rooms });
  }
}
