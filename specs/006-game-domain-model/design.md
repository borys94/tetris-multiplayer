# Lekcja 06 — Model domenowy i stan gry: projekt techniczny

**Status:** Draft — decyzje robocze do zatwierdzenia przed kodowaniem  
**Pakiet:** `packages/game-engine`  
**Podstawa:** `requirements.md`, `spec.md`

## Kontekst

Silnik jest czystą domeną TypeScript. React/Canvas wyświetlają stan, a przyszły serwer autorytatywnie wykonuje reguły gry. Jedna instancja `GameState` opisuje jednego gracza; koordynacja wielu graczy należy do osobnego modelu meczu w przyszłych lekcjach.

## Decyzje

### D-001 — Granica domeny

`GameState` nie zawiera `socketId`, danych pokoju, komponentów UI ani połączeń. Domenę można importować i testować bez serwera. Powiązanie: REQ-001, SPEC-001.

### D-002 — Niemutowalny kontrakt

Publiczne typy i kolekcje są `readonly`. Fabryka zwraca nową wartość; przyszłe przejścia mają postać `nextState = transition(previousState, action)`. `readonly` nie jest runtime deep-freeze — wymagana dyscyplina implementacji i testy. Powiązanie: REQ-004, SPEC-005.

### D-003 — Fabryka inicjalizacji

`createInitialGameState(config: GameConfig): GameState` waliduje argument i zwraca `idle`, wynik `0`, brak figury i pustą planszę. Bez `Math.random()`, `Date.now()` i globalnego stanu. Powiązanie: REQ-003, SPEC-003.

### D-004 — Walidacja Fail Fast

Walidacja wykonywana wewnątrz publicznej fabryki, opcjonalnie przez prywatne `validateGameConfig`. Niepoprawny wymiar powoduje `RangeError`. Nie udostępniamy osobnego `createGameConfig` bez potrzeby. Powiązanie: REQ-003, SPEC-004.

### D-005 — Zakres lekcji

Nie implementujemy ruchu, kolizji, obrotu, SRS, losowania 7-bag, ticków ani naliczania punktów. Powiązanie: REQ-002, SPEC-002.

## Proponowany kontrakt (szkic, nie gotowy kod)

```ts
export interface GameConfig {
  readonly boardWidth: number;
  readonly boardHeight: number;
}

export type GameStatus = "idle" | "playing" | "paused" | "game-over";

export interface GameState {
  readonly board: Board;
  readonly activePiece: ActivePiece | null;
  readonly score: number;
  readonly status: GameStatus;
}

export declare function createInitialGameState(
  config: GameConfig,
): GameState;
```

`Board` i `ActivePiece` wymagają minimalnych, rzeczywistych deklaracji TS, aby API było kompilowalne. Nie stosować fikcyjnych `any` ani pustych typów udających ukończony model. Rozstrzygnąć podczas review TASK-001, czy minimalna reprezentacja planszy w lekcji 06 jest wystarczająca do utworzenia pustego stanu; nie wprowadzać jeszcze reguł geometrii figur.

## Planowana struktura

```text
packages/game-engine/src/
  index.ts                # publiczne eksporty
  domain/                 # nazwa katalogu do weryfikacji z konwencjami repo
    game-state.ts         # GameState, GameStatus i powiązane typy
    game-config.ts        # GameConfig i ewentualny prywatny walidator
    create-initial-state.ts
  ...                     # testy obok implementacji według konwencji repo
```

Dokładne nazwy i liczba plików wymagają weryfikacji z istniejącym kodem. Unikać nadmiernej fragmentacji i nowych zależności.

## Alternatywy i kompromisy

| Opcja | Decyzja | Powód |
|---|---|---|
| Jeden globalny stan gry i meczu | Odrzucona | Silne sprzężenie multiplayera z silnikiem |
| `GameState` na gracza, przyszły `MatchState` osobno | Wybrana | Reużywalność i testowalność |
| Mutacja publicznego stanu | Odrzucona jako domyślna | Ryzyko efektów ubocznych i błędów replay |
| Osobna publiczna fabryka konfiguracji | Odłożona | YAGNI; jedna granica walidacji wystarcza |
| Pełny discriminated union | Odłożony | Brak potwierdzonych reguł wszystkich faz gry |

## Ryzyka / kwestie do rozstrzygnięcia

1. Minimalny kształt `Board` i `ActivePiece`, bez przejmowania zakresu lekcji 07.
2. Czy zestaw `GameStatus` ma już obejmować `paused` i `game-over` — do zatwierdzenia przed TASK-001.
3. Rozsądny górny limit rozmiaru planszy (bezpieczeństwo alokacji): dodatnia bezpieczna liczba całkowita nie ogranicza kosztu pamięci. Nie dopisywać limitu bez decyzji produktowej.
4. Głębokie `readonly` w tablicach nie zabezpiecza przed mutacją runtime z użyciem `as`.

## Weryfikacja

Testy Vitest i przegląd typów/eksportów; uruchomienie `yarn check` po implementacji. Wyników nie oznaczono jako PASS przed wykonaniem.
