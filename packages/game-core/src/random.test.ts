import { describe, expect, it } from "vitest";
import { PIECE_TYPES } from "./pieces";
import { generateBag, nextRandom } from "./random";

describe("random", () => {
  it("is deterministic for the same state", () => {
    expect(nextRandom(42)).toEqual(nextRandom(42));
    expect(nextRandom(42)).not.toEqual(nextRandom(43));
  });

  it("returns values in [0, 1)", () => {
    let state = 1;
    for (let i = 0; i < 1000; i++) {
      const step = nextRandom(state);
      expect(step.value).toBeGreaterThanOrEqual(0);
      expect(step.value).toBeLessThan(1);
      state = step.state;
    }
  });

  it("generates a bag with each piece exactly once", () => {
    const { bag } = generateBag(7);

    expect([...bag].sort()).toEqual([...PIECE_TYPES].sort());
  });
});
