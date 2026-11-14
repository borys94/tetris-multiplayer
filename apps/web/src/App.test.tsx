import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { App } from "./App";
import { TICK_MS } from "./game/loop";

let frameCallback: FrameRequestCallback | null = null;

/** Przesuwa pętlę gry o jedną klatkę z podanym upływem czasu. */
function advanceFrame(ms: number) {
  act(() => frameCallback?.(performance.now() + ms));
}

function press(code: string) {
  fireEvent.keyDown(window, { code });
  fireEvent.keyUp(window, { code });
}

beforeEach(() => {
  frameCallback = null;
  vi.stubGlobal(
    "requestAnimationFrame",
    vi.fn((callback: FrameRequestCallback) => {
      frameCallback = callback;
      return 1;
    }),
  );
  vi.stubGlobal("cancelAnimationFrame", vi.fn());
  vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(null);
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("App (S5)", () => {
  it("shows the start screen and starts on Enter", () => {
    render(<App />);
    expect(screen.getByText("Naciśnij Enter, aby zacząć")).toBeDefined();

    press("Enter");

    expect(screen.queryByText("Naciśnij Enter, aby zacząć")).toBeNull();
    expect(screen.getByTestId("score").textContent).toBe("0");
    expect(screen.getAllByRole("img", { name: /Następny/ })).toHaveLength(3);
  });

  it("applies keyboard input in the game loop and updates the HUD", () => {
    render(<App />);
    press("Enter");

    press("Space");
    advanceFrame(TICK_MS + 1);

    expect(Number(screen.getByTestId("score").textContent)).toBeGreaterThan(0);
  });

  it("holds a piece with C", () => {
    render(<App />);
    press("Enter");

    press("KeyC");
    advanceFrame(TICK_MS + 1);

    expect(screen.queryByRole("img", { name: "Hold: pusto" })).toBeNull();
  });

  it("pauses and resumes with P", () => {
    render(<App />);
    press("Enter");

    press("KeyP");
    expect(screen.getByText("Pauza")).toBeDefined();

    press("KeyP");
    expect(screen.queryByText("Pauza")).toBeNull();
  });

  it("restarts from the pause screen with a fresh game", () => {
    render(<App />);
    press("Enter");
    press("Space");
    advanceFrame(TICK_MS + 1);
    press("KeyP");

    fireEvent.click(screen.getByRole("button", { name: "Restart" }));

    expect(screen.queryByText("Pauza")).toBeNull();
    expect(screen.getByTestId("score").textContent).toBe("0");
  });
});
