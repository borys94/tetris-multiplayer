import { describe, expect, it } from "vitest";
import { MAX_ACTIONS_PER_INPUT, MAX_MESSAGE_BYTES } from "./messages";
import { parseClientMessage, parseServerMessage } from "./parse";

const ID = "a".repeat(22);

describe("parseClientMessage", () => {
  it.each([
    [{ type: "hello", protocol: 1 }],
    [{ type: "hello", protocol: 1, resume: { sessionId: ID, token: ID } }],
    [{ type: "newGame" }],
    [{ type: "input", seq: 1, tick: 0, actions: ["left", "hardDrop"] }],
    [{ type: "pause", tick: 120 }],
    [{ type: "resume" }],
  ])("accepts %j", (msg) => {
    expect(parseClientMessage(JSON.stringify(msg))).toEqual(msg);
  });

  it("drops unknown fields", () => {
    expect(parseClientMessage(JSON.stringify({ type: "resume", score: 999999 }))).toEqual({
      type: "resume",
    });
  });

  it.each([
    ["not JSON", "{"],
    ["a non-object", "[1]"],
    ["an unknown type", JSON.stringify({ type: "setScore", score: 1 })],
    ["an unknown action", JSON.stringify({ type: "input", seq: 1, tick: 0, actions: ["fly"] })],
    ["no actions", JSON.stringify({ type: "input", seq: 1, tick: 0, actions: [] })],
    [
      "too many actions",
      JSON.stringify({
        type: "input",
        seq: 1,
        tick: 0,
        actions: Array(MAX_ACTIONS_PER_INPUT + 1).fill("left"),
      }),
    ],
    ["a zero seq", JSON.stringify({ type: "input", seq: 0, tick: 0, actions: ["left"] })],
    ["a negative tick", JSON.stringify({ type: "pause", tick: -1 })],
    ["a fractional tick", JSON.stringify({ type: "pause", tick: 1.5 })],
    [
      "a short session id",
      JSON.stringify({ type: "hello", protocol: 1, resume: { sessionId: "x", token: ID } }),
    ],
    ["a null resume", JSON.stringify({ type: "hello", protocol: 1, resume: null })],
    [
      "an oversized message",
      JSON.stringify({ type: "resume", pad: "x".repeat(MAX_MESSAGE_BYTES) }),
    ],
  ])("rejects %s (S3)", (_name, raw) => {
    expect(parseClientMessage(raw)).toBeNull();
  });
});

describe("parseServerMessage", () => {
  it("accepts known message types and rejects the rest", () => {
    expect(parseServerMessage(JSON.stringify({ type: "error", code: "invalid" }))).toEqual({
      type: "error",
      code: "invalid",
    });
    expect(parseServerMessage(JSON.stringify({ type: "unknown" }))).toBeNull();
    expect(parseServerMessage("nope")).toBeNull();
  });
});
