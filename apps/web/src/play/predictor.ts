import { applyAction, tick, type Action, type GameState } from "@tetris/game-core";

export interface InputRecord {
  seq: number;
  tick: number;
  actions: readonly Action[];
}

function deepEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (typeof a !== "object" || typeof b !== "object" || a === null || b === null) return false;
  if (Array.isArray(a) !== Array.isArray(b)) return false;
  const keysA = Object.keys(a);
  if (keysA.length !== Object.keys(b).length) return false;
  return keysA.every((key) =>
    deepEqual((a as Record<string, unknown>)[key], (b as Record<string, unknown>)[key]),
  );
}

/**
 * Przewidywanie po stronie klienta (ADR-0006): akcje stosujemy lokalnie od razu,
 * a snapshot serwera porównujemy z przewidzianym stanem z tego samego ticka.
 * Przy różnicy przyjmujemy stan serwera i odtwarzamy niepotwierdzone akcje.
 */
export class Predictor {
  private seq = 0;
  private inputs: InputRecord[] = [];
  /** Przewidziany stan po `k` tickach, dla ticków nowszych od ostatniego snapshotu. */
  private history = new Map<number, GameState>();
  /** Liczba korekt od początku gry (do testów i diagnostyki). */
  corrections = 0;

  constructor(
    public state: GameState,
    public tick: number,
  ) {}

  /** Jeden tick klienta. Zwraca akcje do wysłania serwerowi albo `null`, gdy ich nie było. */
  step(actions: readonly Action[]): InputRecord | null {
    let input: InputRecord | null = null;
    if (actions.length > 0) {
      input = { seq: ++this.seq, tick: this.tick, actions };
      this.inputs.push(input);
      for (const action of actions) this.state = applyAction(this.state, action);
    }
    this.state = tick(this.state);
    this.tick++;
    this.history.set(this.tick, this.state);
    return input;
  }

  /** Uzgadnia stan ze snapshotem serwera; zwraca `true`, gdy trzeba było go poprawić. */
  reconcile(snapshotTick: number, ackSeq: number, server: GameState): boolean {
    this.inputs = this.inputs.filter((input) => input.seq > ackSeq);
    const predicted = this.history.get(snapshotTick);
    // Tick snapshotu zostaje w historii: serwer może go przysłać ponownie (np. przy pauzie).
    for (const k of this.history.keys()) if (k < snapshotTick) this.history.delete(k);

    if (snapshotTick > this.tick) {
      // Serwer jest dalej niż klient (np. przycięta karta w tle): przeskakujemy do niego.
      this.adopt(server, snapshotTick, false);
      this.corrections++;
      return true;
    }
    if (predicted && deepEqual(predicted, server)) return false;

    let state = server;
    this.history.clear();
    for (let k = snapshotTick; k < this.tick; k++) {
      for (const input of this.inputs) {
        // Spóźnione akcje serwer zastosuje najwcześniej na ticku snapshotu.
        if (Math.max(input.tick, snapshotTick) === k) {
          for (const action of input.actions) state = applyAction(state, action);
        }
      }
      state = tick(state);
      this.history.set(k + 1, state);
    }
    this.state = state;
    this.corrections++;
    return true;
  }

  /** Przyjmuje stan serwera w całości (początek gry, wznowienie, pauza). */
  adopt(state: GameState, atTick: number, resetInputs = true): void {
    this.state = state;
    this.tick = atTick;
    this.history.clear();
    if (resetInputs) this.inputs = [];
  }
}
