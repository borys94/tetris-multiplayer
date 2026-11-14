import { applyAction, createGame, tick, type Action, type GameState } from "@tetris/game-core";
import type { ServerMessage } from "@tetris/protocol";
import { describe, expect, it } from "vitest";
import { Session } from "./session";

const SEED = 42;
const BUFFER = 9;

function createSession() {
  const messages: ServerMessage[] = [];
  const session = new Session("id", "token", SEED, { bufferTicks: BUFFER, maxAheadTicks: 60 });
  session.attach((msg) => messages.push(msg));
  return { session, messages };
}

function snapshots(messages: ServerMessage[]) {
  return messages.filter((m) => m.type === "snapshot");
}

/** Gra liczona lokalnie: akcje z `inputs[t]` stosujemy przed `t`-tym tickiem. */
function replay(ticks: number, inputs: Record<number, Action[]>): GameState {
  let game = createGame(SEED);
  for (let t = 0; t < ticks; t++) {
    for (const action of inputs[t] ?? []) game = applyAction(game, action);
    game = tick(game);
  }
  return game;
}

describe("Session", () => {
  it("sends the paused initial game on attach and does not advance while paused", () => {
    const { session, messages } = createSession();
    session.advance(100);

    expect(messages).toEqual([{ type: "game", tick: 0, state: createGame(SEED), paused: true }]);
  });

  it("runs the simulation bufferTicks behind the clock and sends a snapshot every 6 ticks", () => {
    const { session, messages } = createSession();
    session.resume();
    session.advance(BUFFER + 12);

    expect(snapshots(messages).map((m) => m.tick)).toEqual([6, 12]);
  });

  it("applies inputs arriving within the buffer on the client's tick (S1, S2)", () => {
    const { session, messages } = createSession();
    session.resume();
    session.advance(10);
    // Akcje z ticków 5 i 8 docierają, gdy symulacja jest na ticku 1: trafiają dokładnie na swoje ticki.
    expect(session.input(1, 5, ["left", "left"])).toBe(true);
    expect(session.input(2, 8, ["rotateCw"])).toBe(true);
    session.advance(BUFFER + 12);

    const last = snapshots(messages).at(-1);
    expect(last?.ackSeq).toBe(2);
    expect(last?.state).toEqual(replay(last!.tick, { 5: ["left", "left"], 8: ["rotateCw"] }));
  });

  it("applies late inputs on the current simulation tick, never in the past (S3)", () => {
    const { session, messages } = createSession();
    session.resume();
    session.advance(BUFFER + 20); // symulacja na ticku 20

    expect(session.input(1, 3, ["hardDrop"])).toBe(true);
    session.advance(4);

    const last = snapshots(messages).at(-1);
    expect(last?.tick).toBe(24);
    expect(last?.state).toEqual(replay(24, { 20: ["hardDrop"] }));
  });

  it("rejects inputs from the future, out of order or while paused (S3)", () => {
    const { session } = createSession();
    expect(session.input(1, 0, ["left"])).toBe(false); // pauza
    session.resume();
    session.advance(10);

    expect(session.input(1, 10 + 61, ["left"])).toBe(false);
    expect(session.input(2, 10, ["left"])).toBe(false);
    expect(session.input(1, 10, ["left"])).toBe(true);
    expect(session.input(2, 9, ["left"])).toBe(false);
  });

  it("pauses on the client's tick, flushing pending inputs, and resumes from there", () => {
    const { session, messages } = createSession();
    session.resume();
    session.advance(20);
    session.input(1, 15, ["right"]);
    session.pause(18);

    expect(messages.at(-1)).toEqual({
      type: "snapshot",
      tick: 18,
      ackSeq: 1,
      state: replay(18, { 15: ["right"] }),
    });

    session.advance(100);
    expect(messages).toHaveLength(snapshots(messages).length + 1);
    expect(messages.at(-1)).toMatchObject({ tick: 18 });
  });

  it("clamps a pause in the past to the simulation tick (cannot rewind)", () => {
    const { session, messages } = createSession();
    session.resume();
    session.advance(BUFFER + 30);
    session.pause(2);

    expect(messages.at(-1)).toMatchObject({ type: "snapshot", tick: 30 });
  });

  it("pauses on detach and sends the current state on re-attach (S4)", () => {
    const { session } = createSession();
    session.resume();
    session.advance(BUFFER + 30);
    session.detach();
    expect(session.connected).toBe(false);
    session.advance(100);

    const messages: ServerMessage[] = [];
    session.attach((msg) => messages.push(msg));

    expect(messages).toEqual([{ type: "game", tick: 39, state: replay(39, {}), paused: true }]);
  });

  it("decides game over and the score on the server (S1)", () => {
    const { session, messages } = createSession();
    session.resume();
    let seq = 0;
    for (let t = 0; !messages.some((m) => m.type === "over"); t++) {
      session.input(++seq, t, ["hardDrop"]);
      session.advance(1);
    }
    session.advance(BUFFER);

    const over = messages.find((m) => m.type === "over");
    const final = snapshots(messages).at(-1)!;
    expect(final.state.status).toBe("over");
    expect(over).toEqual({
      type: "over",
      score: final.state.score,
      lines: final.state.lines,
      level: final.state.level,
    });
    expect(session.input(seq + 1, final.tick, ["left"])).toBe(true); // ignorowane po końcu
  });

  it("starts a new paused game", () => {
    const { session, messages } = createSession();
    session.resume();
    session.advance(50);
    session.newGame(7);

    expect(messages.at(-1)).toEqual({ type: "game", tick: 0, state: createGame(7), paused: true });
    session.resume();
    expect(session.input(1, 0, ["left"])).toBe(true);
  });
});
