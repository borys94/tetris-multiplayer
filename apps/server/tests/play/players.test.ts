import type { ServerMessage } from "@tetris/protocol";
import { describe, expect, it } from "vitest";
import { SessionStore } from "../../src/game/session-store";
import { RoomStore } from "../../src/rooms/room-store";
import { Player, Players, type PlayerClient } from "../../src/play/players";

function client() {
  const messages: ServerMessage[] = [];
  let replaced = 0;
  const value: PlayerClient = {
    send: (msg) => messages.push(msg),
    replaced: () => replaced++,
  };
  return { ...value, messages, replacedCount: () => replaced };
}

function setup(maxSessions = 5) {
  const sessions = new SessionStore({
    bufferTicks: 3,
    maxAheadTicks: 60,
    maxSessions,
    ttlMs: 1000,
  });
  const rooms = new RoomStore({ bufferTicks: 3, maxAheadTicks: 60, ttlMs: 1000, maxRooms: 5 });
  return { sessions, rooms, players: new Players(sessions, rooms) };
}

function connect(players: Players, c = client(), account = null) {
  const player = players.connect(c, account);
  if (!(player instanceof Player)) throw new Error(String(player));
  return player;
}

describe("Players", () => {
  it("welcomes a new player with a fresh session", () => {
    const { players } = setup();
    const c = client();
    const player = connect(players, c);
    expect(c.messages[0]).toEqual({
      type: "welcome",
      sessionId: player.session.id,
      token: player.session.token,
    });
    expect(c.messages[1]?.type).toBe("game");
  });

  it("reports a full server and an expired session", () => {
    const { players } = setup(1);
    connect(players);
    expect(players.connect(client(), null)).toBe("server_full");
    expect(players.connect(client(), null, { sessionId: "x", token: "y" })).toBe("session_expired");
  });

  it("hands a resumed session over to the new connection (second tab)", () => {
    const { players, sessions } = setup();
    const first = client();
    const old = connect(players, first);
    const { id, token } = old.session;

    const second = client();
    const resumed = players.connect(second, null, { sessionId: id, token });
    expect(resumed).toBeInstanceOf(Player);
    expect(first.replacedCount()).toBe(1);
    expect(old.resume()).toBe(false);

    // Zamknięcie starego połączenia nie odłącza sesji od nowego.
    old.disconnect();
    expect((resumed as Player).session.connected).toBe(true);
    expect(sessions.size).toBe(1);
  });

  it("forbids singleplayer and pause inside a room (spec 007)", () => {
    const { players } = setup();
    const c = client();
    const player = connect(players, c, null);
    expect(player.createRoom("public")).toBe(true);
    expect(c.messages.some((m) => m.type === "room")).toBe(true);
    expect(player.pause(0)).toBe(false);
    expect(player.newGame()).toBe(false);
    expect(player.leaveRoom()).toBe(true);
    expect(player.newGame()).toBe(true);
  });
});
