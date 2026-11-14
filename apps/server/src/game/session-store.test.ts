import { describe, expect, it } from "vitest";
import { SessionStore } from "./session-store";

function createStore() {
  const clock = { now: 0 };
  const store = new SessionStore(
    { bufferTicks: 9, maxAheadTicks: 60, maxSessions: 1, ttlMs: 1000 },
    () => clock.now,
  );
  return { store, clock };
}

describe("SessionStore", () => {
  it("finds a session only with its token", () => {
    const { store } = createStore();
    const session = store.create()!;

    expect(store.find(session.id, session.token)).toBe(session);
    expect(store.find(session.id, "wrong")).toBeNull();
    expect(store.find("missing", session.token)).toBeNull();
  });

  it("limits the number of sessions", () => {
    const { store } = createStore();
    expect(store.create()).not.toBeNull();
    expect(store.create()).toBeNull();
  });

  it("expires sessions detached for longer than the TTL, but not re-attached ones (S4)", () => {
    const { store, clock } = createStore();
    const session = store.create()!;
    store.markDetached(session);
    clock.now = 999;
    store.markAttached(session);
    clock.now = 5000;
    expect(store.find(session.id, session.token)).toBe(session);

    store.markDetached(session);
    clock.now = 6000;
    expect(store.find(session.id, session.token)).toBeNull();
    expect(store.size).toBe(0);
  });
});
