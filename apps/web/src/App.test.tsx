import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { App } from "./App";

describe("App", () => {
  it("renders the title and board size from game-core", () => {
    render(<App />);

    expect(screen.getByRole("heading", { name: "Tetris Multiplayer" })).toBeDefined();
    expect(screen.getByText("Plansza 10×20")).toBeDefined();
  });
});
