import { describe, expect, it } from "vitest";
import { gravityTicks, levelForLines, lineClearScore } from "./scoring";

describe("scoring", () => {
  it("scores line clears by count and level", () => {
    expect([0, 1, 2, 3, 4].map((lines) => lineClearScore(lines, 1))).toEqual([
      0, 100, 300, 500, 800,
    ]);
    expect(lineClearScore(4, 3)).toBe(2400);
  });

  it("raises the level every 10 lines", () => {
    expect(levelForLines(0)).toBe(1);
    expect(levelForLines(9)).toBe(1);
    expect(levelForLines(10)).toBe(2);
    expect(levelForLines(25)).toBe(3);
  });

  it("speeds up gravity with level, never below 1 tick", () => {
    expect(gravityTicks(1)).toBe(60);
    expect(gravityTicks(2)).toBeLessThan(gravityTicks(1));
    expect(gravityTicks(30)).toBe(1);
  });
});
