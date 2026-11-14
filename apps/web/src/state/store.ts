/**
 * Stan widoku poza Reactem: komponent czyta `getState()` i zapisuje się przez `subscribe`
 * (`useSyncExternalStore`). Każda zmiana tworzy nowy obiekt stanu, a zmiana bez różnic
 * nie powiadamia słuchaczy, więc nie wymusza renderu.
 */
export class Store<S extends object> {
  private readonly listeners = new Set<() => void>();

  constructor(private state: S) {}

  getState = (): S => this.state;

  subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => void this.listeners.delete(listener);
  };

  protected setState(patch: Partial<S>): void {
    const changed = (Object.keys(patch) as (keyof S)[]).some(
      (key) => !Object.is(patch[key], this.state[key]),
    );
    if (!changed) return;
    this.state = { ...this.state, ...patch };
    for (const listener of this.listeners) listener();
  }
}

/** Słuchacze bez stanu (np. „plansza się zmieniła, narysuj ją”). */
export class Signal {
  private readonly listeners = new Set<() => void>();

  watch = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => void this.listeners.delete(listener);
  };

  emit(): void {
    for (const listener of this.listeners) listener();
  }
}
