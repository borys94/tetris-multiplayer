import type { ClientMessage } from "@tetris/protocol";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
// Serwer w pamięci: prawdziwa sesja z `apps/server`, bez sieci i bez opóźnień.
import { Session } from "../../server/src/game/session";
import { App } from "./App";
import type { ConnectFn } from "./components/Game";
import { TICK_MS } from "./game/loop";
import type { ConnectionHandlers } from "./net/connection";

let frameCallback: FrameRequestCallback | null = null;

/** Przesuwa pętlę gry o jedną klatkę z podanym upływem czasu. */
function advanceFrame(ms: number) {
  act(() => frameCallback?.(performance.now() + ms));
}

function press(code: string) {
  fireEvent.keyDown(window, { code });
  fireEvent.keyUp(window, { code });
}

/** Łączy klienta z sesją w pamięci; `sent` zbiera wiadomości klienta. */
function inMemoryServer() {
  const sent: ClientMessage[] = [];
  let seed = 1;
  let handlers: ConnectionHandlers | null = null;
  let online = false;
  const session = new Session("id", "token", seed, { bufferTicks: 0, maxAheadTicks: 60 });

  const connect: ConnectFn = (h) => {
    handlers = h;
    online = true;
    h.onStatus("online");
    h.onMessage({ type: "welcome", sessionId: "id", token: "token" });
    session.attach((msg) => h.onMessage(msg));
    return {
      send(msg) {
        if (!online) return false;
        sent.push(msg);
        if (msg.type === "resume") session.resume();
        if (msg.type === "pause") session.pause(msg.tick);
        if (msg.type === "newGame") session.newGame(++seed);
        if (msg.type === "input") session.input(msg.seq, msg.tick, msg.actions);
        return true;
      },
      stop() {
        online = false;
      },
    };
  };

  return {
    connect,
    sent,
    session,
    disconnect() {
      act(() => {
        online = false;
        session.detach();
        handlers?.onStatus("offline");
      });
    },
    reconnect() {
      act(() => {
        online = true;
        handlers?.onStatus("online");
        session.attach((msg) => handlers?.onMessage(msg));
      });
    },
    receive(msg: Parameters<ConnectionHandlers["onMessage"]>[0]) {
      act(() => handlers?.onMessage(msg));
    },
  };
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

describe("App", () => {
  it("is called Blockfall", () => {
    render(<App connect={inMemoryServer().connect} />);
    expect(screen.getByRole("heading", { name: "Blockfall" })).toBeDefined();
  });

  it("shows the start screen with the server's game and starts on Enter", () => {
    const server = inMemoryServer();
    render(<App connect={server.connect} />);
    expect(screen.getByText("Naciśnij Enter, aby zacząć")).toBeDefined();
    expect(screen.getByRole("status").textContent).toBe("Połączono");

    press("Enter");

    expect(screen.queryByText("Naciśnij Enter, aby zacząć")).toBeNull();
    expect(screen.getByTestId("score").textContent).toBe("0");
    expect(screen.getAllByRole("img", { name: /Następny/ })).toHaveLength(3);
    expect(server.sent).toEqual([{ type: "resume" }]);
  });

  it("predicts input locally and sends only actions to the server (S1)", () => {
    const server = inMemoryServer();
    render(<App connect={server.connect} />);
    press("Enter");

    press("Space");
    advanceFrame(TICK_MS + 1);

    expect(Number(screen.getByTestId("score").textContent)).toBeGreaterThan(0);
    expect(server.sent.at(-1)).toEqual({ type: "input", seq: 1, tick: 0, actions: ["hardDrop"] });
  });

  it("shows the final score sent by the server, not the local one (S1)", () => {
    const server = inMemoryServer();
    render(<App connect={server.connect} />);
    press("Enter");

    server.receive({ type: "over", score: 4321, lines: 3, level: 1 });

    expect(screen.getByText("Koniec gry")).toBeDefined();
    expect(screen.getByTestId("final-score").textContent).toBe("Wynik: 4321");
  });

  it("starts a new game from the game-over screen", () => {
    const server = inMemoryServer();
    render(<App connect={server.connect} />);
    press("Enter");
    server.receive({ type: "over", score: 1, lines: 0, level: 1 });

    press("Enter");

    expect(server.sent.slice(-2)).toEqual([{ type: "newGame" }, { type: "resume" }]);
    expect(screen.queryByText("Koniec gry")).toBeNull();
  });

  it("pauses on the client's tick and resumes with P", () => {
    const server = inMemoryServer();
    render(<App connect={server.connect} />);
    press("Enter");
    advanceFrame(TICK_MS * 3 + 1);

    press("KeyP");
    expect(screen.getByText("Pauza")).toBeDefined();
    expect(server.sent.at(-1)).toEqual({ type: "pause", tick: 3 });

    press("KeyP");
    expect(screen.queryByText("Pauza")).toBeNull();
  });

  it("restarts from the pause screen with a fresh game", () => {
    const server = inMemoryServer();
    render(<App connect={server.connect} />);
    press("Enter");
    press("Space");
    advanceFrame(TICK_MS + 1);
    press("KeyP");

    fireEvent.click(screen.getByRole("button", { name: "Restart" }));

    expect(screen.queryByText("Pauza")).toBeNull();
    expect(screen.getByTestId("score").textContent).toBe("0");
  });

  it("pauses when the connection drops and resumes the same game after reconnecting (S4)", () => {
    const server = inMemoryServer();
    render(<App connect={server.connect} />);
    press("Enter");
    press("Space");
    advanceFrame(TICK_MS + 1);
    act(() => server.session.advance(2)); // serwer stosuje hard drop
    const score = screen.getByTestId("score").textContent;

    server.disconnect();
    expect(screen.getByText("Pauza")).toBeDefined();
    expect(screen.getByRole("button", { name: "Wznów" })).toHaveProperty("disabled", true);

    server.reconnect();
    expect(screen.getByText("Pauza")).toBeDefined();
    expect(screen.getByTestId("score").textContent).toBe(score);

    fireEvent.click(screen.getByRole("button", { name: "Wznów" }));
    expect(screen.queryByText("Pauza")).toBeNull();
  });
});
