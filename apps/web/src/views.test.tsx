import { act, cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { App } from "./App";
import type { ConnectFn } from "./components/Game";
import { GUEST, fakeApi } from "./test/fake-api";

const PLAYER = { id: 2, username: "pawn", role: null };
const ADMIN = { id: 1, username: "boss", role: "admin" };

/** Serwer gry, który od razu kończy grę wynikiem 500. */
const finishedGame: ConnectFn = (handlers) => {
  handlers.onStatus("online");
  handlers.onMessage({ type: "welcome", sessionId: "s".repeat(22), token: "t".repeat(22) });
  queueMicrotask(() => handlers.onMessage({ type: "over", score: 500, lines: 4, level: 1 }));
  return { send: () => true, stop: () => {} };
};

async function navigate(hash: string) {
  await act(async () => {
    window.location.hash = hash;
    window.dispatchEvent(new HashChangeEvent("hashchange"));
    await Promise.resolve();
  });
}

beforeEach(() => {
  vi.stubGlobal("requestAnimationFrame", vi.fn());
  vi.stubGlobal("cancelAnimationFrame", vi.fn());
  vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(null);
  window.location.hash = "";
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("account (S1)", () => {
  it("logs in from the account view and shows the username in the menu", async () => {
    const calls = fakeApi({
      ...GUEST,
      "POST /auth/login": () => [200, { user: PLAYER }],
      "GET /me/games": () => [200, { games: [] }],
    });
    render(<App connect={finishedGame} />);
    await navigate("#/konto");

    fireEvent.change(await screen.findByLabelText("Login"), { target: { value: "Pawn" } });
    fireEvent.change(screen.getByLabelText("Hasło"), {
      target: { value: "correct horse battery" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Zaloguj" }));

    expect(await screen.findByText("Zalogowano jako pawn")).toBeDefined();
    expect(within(screen.getByRole("navigation")).getByText("pawn")).toBeDefined();
    expect(calls).toContainEqual({
      key: "POST /auth/login",
      body: { username: "Pawn", password: "correct horse battery" },
    });
  });

  it("shows the server's error message for bad credentials", async () => {
    fakeApi({ ...GUEST, "POST /auth/login": () => [401, { error: "invalid_credentials" }] });
    render(<App connect={finishedGame} />);
    await navigate("#/konto");

    fireEvent.change(await screen.findByLabelText("Login"), { target: { value: "pawn" } });
    fireEvent.change(screen.getByLabelText("Hasło"), { target: { value: "wrong password" } });
    fireEvent.click(screen.getByRole("button", { name: "Zaloguj" }));

    expect((await screen.findByRole("alert")).textContent).toBe("Zły login lub hasło");
  });

  it("registers from the registration tab", async () => {
    const calls = fakeApi({ ...GUEST, "POST /auth/register": () => [201, { user: PLAYER }] });
    render(<App connect={finishedGame} />);
    await navigate("#/konto");

    fireEvent.click(await screen.findByRole("tab", { name: "Rejestracja" }));
    fireEvent.change(screen.getByLabelText("Login"), { target: { value: "pawn" } });
    fireEvent.change(screen.getByLabelText("Hasło"), {
      target: { value: "correct horse battery" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Załóż konto" }));

    expect(await screen.findByText("Zalogowano jako pawn")).toBeDefined();
    expect(calls.map((c) => c.key)).toContain("POST /auth/register");
  });
});

describe("game over prompt (S2)", () => {
  it("invites a guest to create an account", async () => {
    fakeApi(GUEST);
    render(<App connect={finishedGame} />);

    expect(await screen.findByText(/aby zapisywać wyniki w rankingu/)).toBeDefined();
    expect(screen.getByRole("link", { name: "Załóż konto" }).getAttribute("href")).toBe("#/konto");
  });

  it("does not show the prompt to a logged-in player", async () => {
    fakeApi({ "GET /me": () => [200, { user: PLAYER }] });
    render(<App connect={finishedGame} />);

    expect(await screen.findByTestId("final-score")).toBeDefined();
    expect(screen.queryByText(/aby zapisywać wyniki/)).toBeNull();
  });
});

describe("leaderboard (R3)", () => {
  it("shows the best scores", async () => {
    fakeApi({
      ...GUEST,
      "GET /leaderboard": () => [
        200,
        {
          entries: [
            {
              rank: 1,
              gameId: 7,
              username: "ace",
              score: 9000,
              lines: 50,
              level: 6,
              endedAt: "2026-11-14T10:00:00Z",
            },
          ],
        },
      ],
    });
    render(<App connect={finishedGame} />);
    await navigate("#/ranking");

    const row = (await screen.findByText("ace")).closest("tr")!;
    expect(within(row).getByText("9000")).toBeDefined();
  });
});

describe("admin panel (R4, S4)", () => {
  it("is hidden from players", async () => {
    fakeApi({ "GET /me": () => [200, { user: PLAYER }] });
    render(<App connect={finishedGame} />);
    await screen.findByText("pawn");

    expect(screen.queryByRole("link", { name: "Admin" })).toBeNull();
    await navigate("#/admin");
    expect(screen.queryByText("Panel admina")).toBeNull();
  });

  it("lets an admin disable a player and set a temporary password, but not change themselves", async () => {
    const users = [
      { ...ADMIN, disabled: false, createdAt: "2026-11-01T10:00:00Z" },
      { ...PLAYER, disabled: false, createdAt: "2026-11-02T10:00:00Z" },
    ];
    const calls = fakeApi({
      "GET /me": () => [200, { user: ADMIN }],
      "GET /admin/users?q=": () => [200, { users }],
      "PATCH /admin/users/2": (body) => [200, { user: { ...users[1], ...(body as object) } }],
      "POST /admin/users/2/password": () => [200, { password: "Tmp-Pass-123456_" }],
    });
    vi.spyOn(window, "confirm").mockReturnValue(true);
    render(<App connect={finishedGame} />);
    await screen.findByRole("link", { name: "Admin" });
    await navigate("#/admin");

    const table = await screen.findByRole("table", { name: "Konta" });
    const adminRow = within(table).getByText(/^boss/).closest("tr")!;
    expect(within(adminRow).getByRole("button", { name: "Zablokuj" })).toHaveProperty(
      "disabled",
      true,
    );

    const playerRow = within(table).getByText(/^pawn/).closest("tr")!;
    fireEvent.click(within(playerRow).getByRole("button", { name: "Zablokuj" }));
    expect(await within(playerRow).findByText(/zablokowany/)).toBeDefined();
    expect(calls).toContainEqual({ key: "PATCH /admin/users/2", body: { disabled: true } });

    fireEvent.click(within(playerRow).getByRole("button", { name: "Hasło tymczasowe" }));
    expect(await within(playerRow).findByText("Tmp-Pass-123456_")).toBeDefined();
  });
});
