import { describe, expect, it } from "vitest";
import { ROOM_LINK, viewOf } from "../../src/app/routes";

describe("routes", () => {
  it("maps URL hashes to views, with the game as default", () => {
    expect(viewOf("")).toBe("game");
    expect(viewOf("#/ranking")).toBe("ranking");
    expect(viewOf("#/nieznany")).toBe("game");
  });

  it("opens 1v1 for a room link", () => {
    expect(viewOf("#/pokoj/ABC123")).toBe("versus");
    expect(ROOM_LINK.exec("#/pokoj/ABC123")?.[1]).toBe("ABC123");
    expect(viewOf("#/pokoj/ABC")).toBe("game");
  });
});
