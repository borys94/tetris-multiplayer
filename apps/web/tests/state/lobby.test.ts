// @vitest-environment node
import type { ClientMessage } from "@tetris/protocol";
import { describe, expect, it } from "vitest";
import { Lobby, roomHint, waitingFor } from "../../src/state/lobby";
import type { RoomMessage } from "../../src/state/messages";

function setup() {
  const sent: ClientMessage[] = [];
  const lobby = new Lobby(
    (msg) => {
      sent.push(msg);
      return true;
    },
    () => 5_000,
  );
  return { lobby, sent };
}

const room = (patch: Partial<RoomMessage> = {}): RoomMessage => ({
  type: "room",
  code: "ABC123",
  visibility: "public",
  state: "waiting",
  players: [{ name: "ala", host: true, ready: false, connected: true }],
  you: 0,
  ...patch,
});

describe("Lobby", () => {
  it("keeps the room list with the time it arrived", () => {
    const { lobby } = setup();
    lobby.receive({ type: "rooms", rooms: [] });
    expect(lobby.getState().rooms).toEqual({ rooms: [], receivedAt: 5_000 });
  });

  it("shows room errors and clears them when the player enters a room", () => {
    const { lobby } = setup();
    lobby.receive({ type: "error", code: "room_full" });
    expect(lobby.getState().error).toBe("Pokój jest pełny albo mecz już trwa");
    lobby.receive({ type: "error", code: "invalid" });
    expect(lobby.getState().error).toBe("Pokój jest pełny albo mecz już trwa");

    lobby.receive(room());
    expect(lobby.getState()).toMatchObject({ error: null, room: { code: "ABC123" } });
    lobby.receive({ type: "roomClosed" });
    expect(lobby.getState().room).toBeNull();
  });

  it("joins from a room link once, only outside a room", () => {
    const { lobby, sent } = setup();
    expect(lobby.followLink("#/1v1")).toBe(false);
    expect(lobby.followLink("#/pokoj/abc123")).toBe(true);
    expect(sent).toEqual([{ type: "joinRoom", code: "ABC123" }]);

    lobby.receive(room());
    expect(lobby.followLink("#/pokoj/XYZ999")).toBe(true);
    expect(sent).toHaveLength(1);
  });

  it("subscribes to the room list until unwatched", () => {
    const { lobby, sent } = setup();
    const unwatch = lobby.watchRooms();
    unwatch();
    expect(sent).toEqual([{ type: "watchRooms" }, { type: "unwatchRooms" }]);
  });
});

describe("room texts", () => {
  it("explains what the room waits for", () => {
    expect(roomHint(room())).toBe("Czekamy na drugiego gracza");
    const two = room({
      players: [
        { name: "ala", host: true, ready: true, connected: true },
        { name: "bob", host: false, ready: false, connected: true },
      ],
    });
    expect(roomHint(two)).toBe("Czekamy na gotowość przeciwnika");
    expect(roomHint({ ...two, you: 1 })).toBe("Kliknij „Gotowe”, gdy chcesz zacząć");
    expect(roomHint(room({ state: "playing" }))).toBe("Mecz trwa");
  });

  it("shows how long a room waits", () => {
    expect(waitingFor(0, 30_000)).toBe("przed chwilą");
    expect(waitingFor(0, 125_000)).toBe("2 min");
  });
});
