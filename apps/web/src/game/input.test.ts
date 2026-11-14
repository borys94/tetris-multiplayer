import { describe, expect, it } from "vitest";
import { ARR_TICKS, DAS_TICKS, InputController, SOFT_DROP_TICKS, isGameKey } from "./input";

function updates(input: InputController, count: number) {
  return Array.from({ length: count }, () => input.update());
}

describe("InputController", () => {
  it("emits single actions on key press", () => {
    const input = new InputController();
    input.keyDown("Space");
    input.keyDown("KeyC");

    expect(input.update()).toEqual(["hardDrop", "hold"]);
    expect(input.update()).toEqual([]);
  });

  it("auto-repeats horizontal moves after DAS, every ARR ticks", () => {
    const input = new InputController();
    input.keyDown("ArrowLeft");

    const frames = updates(input, DAS_TICKS + ARR_TICKS * 2);
    const leftTicks = frames.flatMap((actions, i) => (actions.includes("left") ? [i + 1] : []));

    expect(leftTicks).toEqual([1, DAS_TICKS, DAS_TICKS + ARR_TICKS, DAS_TICKS + ARR_TICKS * 2]);
  });

  it("stops repeating on key release", () => {
    const input = new InputController();
    input.keyDown("ArrowRight");
    input.update();
    input.keyUp("ArrowRight");

    expect(updates(input, DAS_TICKS * 2).flat()).toEqual([]);
  });

  it("prefers the most recently pressed direction", () => {
    const input = new InputController();
    input.keyDown("ArrowLeft");
    input.keyDown("ArrowRight");
    input.update();

    expect(updates(input, DAS_TICKS).flat()).not.toContain("left");
  });

  it("repeats soft drop while held", () => {
    const input = new InputController();
    input.keyDown("ArrowDown");
    const frames = updates(input, SOFT_DROP_TICKS * 3);
    input.keyUp("ArrowDown");

    expect(frames.flat().filter((a) => a === "softDrop")).toHaveLength(4);
    expect(input.update()).toEqual([]);
  });

  it("ignores unknown keys and clears state on reset", () => {
    const input = new InputController();
    input.keyDown("KeyQ");
    input.keyDown("ArrowLeft");
    input.reset();

    expect(isGameKey("KeyQ")).toBe(false);
    expect(updates(input, DAS_TICKS * 2).flat()).toEqual([]);
  });
});
