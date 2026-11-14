import type { Action } from "@tetris/game-core";
import {
  ACTIONS,
  MAX_ACTIONS_PER_INPUT,
  MAX_MESSAGE_BYTES,
  type ClientMessage,
  type ServerMessage,
} from "./messages";

const MAX_COUNTER = 2 ** 31 - 1;
const ID_PATTERN = /^[A-Za-z0-9_-]{16,64}$/;

type Json = Record<string, unknown>;

function parseObject(raw: string): Json | null {
  try {
    const value: unknown = JSON.parse(raw);
    return typeof value === "object" && value !== null && !Array.isArray(value)
      ? (value as Json)
      : null;
  } catch {
    return null;
  }
}

function isCounter(value: unknown, min: number): value is number {
  return Number.isInteger(value) && (value as number) >= min && (value as number) <= MAX_COUNTER;
}

function isId(value: unknown): value is string {
  return typeof value === "string" && ID_PATTERN.test(value);
}

function isAction(value: unknown): value is Action {
  return (ACTIONS as readonly unknown[]).includes(value);
}

function parseActions(value: unknown): Action[] | null {
  if (!Array.isArray(value) || value.length === 0 || value.length > MAX_ACTIONS_PER_INPUT) {
    return null;
  }
  return value.every(isAction) ? value : null;
}

/**
 * Waliduje wiadomość od klienta. Zwraca nowy obiekt z samymi znanymi polami
 * albo `null`, gdy wiadomość jest za duża, nie jest JSON-em lub ma złą strukturę.
 */
export function parseClientMessage(raw: string): ClientMessage | null {
  if (raw.length > MAX_MESSAGE_BYTES) return null;
  const msg = parseObject(raw);
  if (!msg) return null;

  switch (msg.type) {
    case "hello": {
      if (!isCounter(msg.protocol, 0)) return null;
      if (msg.resume === undefined) return { type: "hello", protocol: msg.protocol };
      const resume = msg.resume as Json | null;
      if (typeof resume !== "object" || resume === null) return null;
      if (!isId(resume.sessionId) || !isId(resume.token)) return null;
      return {
        type: "hello",
        protocol: msg.protocol,
        resume: { sessionId: resume.sessionId, token: resume.token },
      };
    }
    case "newGame":
    case "resume":
      return { type: msg.type };
    case "input": {
      const actions = parseActions(msg.actions);
      if (!isCounter(msg.seq, 1) || !isCounter(msg.tick, 0) || !actions) return null;
      return { type: "input", seq: msg.seq, tick: msg.tick, actions };
    }
    case "pause":
      return isCounter(msg.tick, 0) ? { type: "pause", tick: msg.tick } : null;
    default:
      return null;
  }
}

const SERVER_TYPES: ReadonlySet<unknown> = new Set([
  "welcome",
  "game",
  "snapshot",
  "over",
  "error",
]);

/** Odczytuje wiadomość od serwera; serwerowi ufamy, więc sprawdzamy tylko JSON i typ. */
export function parseServerMessage(raw: string): ServerMessage | null {
  const msg = parseObject(raw);
  return msg && SERVER_TYPES.has(msg.type) ? (msg as unknown as ServerMessage) : null;
}
