import { describe, expect, it } from "vitest";
import { BufferedClock } from "../../src/game/buffered-clock";

describe("BufferedClock (ADR-0006)", () => {
  it("asks the simulation to stay bufferTicks behind the clock", () => {
    const clock = new BufferedClock({ bufferTicks: 3, maxAheadTicks: 60 });
    const targets: number[] = [];

    clock.advance(5, (target) => targets.push(target));

    expect(targets).toEqual([-2, -1, 0, 1, 2]);
    expect(clock.tick).toBe(5);
    expect(clock.maxInputTick).toBe(65);
  });

  it("restarts the buffer from the simulation tick after a pause", () => {
    const clock = new BufferedClock({ bufferTicks: 3, maxAheadTicks: 60 });
    clock.advance(10, () => {});
    clock.set(7);

    const targets: number[] = [];
    clock.advance(1, (target) => targets.push(target));
    expect(targets).toEqual([5]);
  });
});
