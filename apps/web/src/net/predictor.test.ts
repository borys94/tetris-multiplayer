import { createGame, type Action } from "@tetris/game-core";
import type { ClientMessage, ServerMessage } from "@tetris/protocol";
import { describe, expect, it } from "vitest";
// Test end-to-end netcode'u: prawdziwa sesja serwera (bez sieci) i przewidywanie klienta.
import { Session } from "../../../server/src/game/session";
import { Predictor } from "./predictor";

const SEED = 1234;
const BUFFER_TICKS = 9; // domyślne 150 ms

interface InFlight<T> {
  at: number;
  msg: T;
}

/**
 * Symuluje grę klienta z serwerem w krokach po 1 ticku (16,7 ms).
 * `upDelay(n)` i `downDelay` to opóźnienia w tickach w obie strony.
 */
function simulate(options: {
  ticks: number;
  script: Record<number, Action[]>;
  upDelay: (index: number) => number;
  downDelay: number;
}) {
  const session = new Session("id", "token", SEED, {
    bufferTicks: BUFFER_TICKS,
    maxAheadTicks: 60,
  });
  const toClient: InFlight<ServerMessage>[] = [];
  const toServer: InFlight<ClientMessage>[] = [];
  let now = 0;
  let sent = 0;
  let last: Extract<ServerMessage, { type: "snapshot" }> | undefined;
  session.attach((msg) => toClient.push({ at: now + options.downDelay, msg }));
  const predictor = new Predictor(createGame(SEED), 0);
  // TCP nie zmienia kolejności: opóźniona wiadomość wstrzymuje też kolejne.
  const send = (msg: ClientMessage) =>
    toServer.push({
      at: Math.max(now + options.upDelay(sent++), toServer.at(-1)?.at ?? 0),
      msg,
    });

  const deliver = () => {
    while (toServer[0] && toServer[0].at <= now) {
      const { msg } = toServer.shift()!;
      if (msg.type === "resume") session.resume();
      if (msg.type === "input") expect(session.input(msg.seq, msg.tick, msg.actions)).toBe(true);
      if (msg.type === "pause") session.pause(msg.tick);
    }
    while (toClient[0] && toClient[0].at <= now) {
      const { msg } = toClient.shift()!;
      if (msg.type === "snapshot") {
        last = msg;
        predictor.reconcile(msg.tick, msg.ackSeq, msg.state);
      }
    }
  };

  send({ type: "resume" });
  for (; now < options.ticks; now++) {
    deliver();
    session.advance(1);
    const input = predictor.step(options.script[predictor.tick] ?? []);
    if (input) send({ type: "input", ...input, actions: [...input.actions] });
  }
  const pausedAt = predictor.tick;
  send({ type: "pause", tick: pausedAt });
  for (const end = now + 60; now < end; now++) deliver();

  return { predictor, pausedAt, last: last! };
}

// Kilka klocków: ruchy w bok, obroty, hold i hard dropy.
const SCRIPT: Record<number, Action[]> = {
  10: ["left", "left"],
  20: ["rotateCw"],
  30: ["hardDrop"],
  45: ["right", "rotateCcw"],
  52: ["right"],
  60: ["hardDrop"],
  70: ["hold"],
  85: ["left", "rotateCw"],
  95: ["hardDrop"],
  110: ["softDrop"],
  112: ["softDrop"],
  130: ["hardDrop"],
};

describe("Predictor with a server session (S2)", () => {
  it.each([
    ["RTT 100 ms", 3],
    ["RTT 300 ms", 9],
  ])("does not correct anything at a steady %s", (_name, oneWay) => {
    const { predictor, pausedAt, last } = simulate({
      ticks: 180,
      script: SCRIPT,
      upDelay: () => oneWay,
      downDelay: oneWay,
    });

    expect(predictor.corrections).toBe(0);
    expect(last.tick).toBe(pausedAt);
    expect(predictor.state).toEqual(last.state);
  });

  it("corrects a message delayed by 300 ms more than the rest and ends in the server state", () => {
    const { predictor, pausedAt, last } = simulate({
      ticks: 180,
      script: SCRIPT,
      // Trzecia wiadomość z akcjami (hard drop na ticku 30) dociera 18 ticków później niż reszta.
      upDelay: (index) => (index === 3 ? 3 + 18 : 3),
      downDelay: 3,
    });

    expect(predictor.corrections).toBeGreaterThan(0);
    // Snapshot z pauzy jest ostatnim słowem serwera: stan klienta musi mu odpowiadać.
    expect(last.tick).toBe(pausedAt);
    expect(predictor.state).toEqual(last.state);
  });
});

describe("Predictor", () => {
  it("returns numbered inputs only for ticks with actions", () => {
    const predictor = new Predictor(createGame(SEED), 0);
    expect(predictor.step([])).toBeNull();
    expect(predictor.step(["left"])).toEqual({ seq: 1, tick: 1, actions: ["left"] });
    expect(predictor.step(["right"])).toEqual({ seq: 2, tick: 2, actions: ["right"] });
    expect(predictor.tick).toBe(3);
  });

  it("jumps forward when the server snapshot is ahead of the client", () => {
    const predictor = new Predictor(createGame(SEED), 0);
    const server = new Predictor(createGame(SEED), 0);
    for (let i = 0; i < 30; i++) server.step([]);

    expect(predictor.reconcile(30, 0, server.state)).toBe(true);
    expect(predictor.tick).toBe(30);
    expect(predictor.state).toEqual(server.state);
  });
});
