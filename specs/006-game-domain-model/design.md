# Lekcja 06 — Model domenowy i stan gry: projekt techniczny

**Status:** Approved — zatwierdzono przez właściciela 2026-11-13  
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

### D-006 — Plansza jako wiersze

`Board = { width, height, rows }`, gdzie `rows: readonly (readonly Cell[])[]` (od góry do dołu, `rows[y][x]`), a `Cell = PieceKind | null` (`null` = puste pole). Wiersze dają czytelne fixtures testowe i proste usuwanie linii (L14); typ komórki przechowuje rodzaj figury, bo renderer (L17) potrzebuje koloru zablokowanych bloków. Odrzucone: płaska tablica (tańsza serializacja, ale indeksowanie `y * width + x` i trudniejsze usuwanie linii — możliwa lokalna zmiana po profilowaniu, L53) oraz typ nieprzezroczysty (abstrakcja przed pierwszym użyciem). Bufor ukrytych wierszy i znaczenie `boardHeight` względem bufora — L07. Powiązanie: REQ-002, SPEC-002.

### D-007 — Aktywna figura znormalizowana

`ActivePiece = { kind: PieceKind, rotation: Rotation, position: Position }`, `PieceKind = 'I' | 'J' | 'L' | 'O' | 'S' | 'T' | 'Z'`, `Rotation = 0 | 1 | 2 | 3`. Zajmowane pola wynikają z `kind` i `rotation` (tabele kształtów: L07, SRS: L09) — nie przechowujemy ich, aby nie tworzyć zdublowanych danych i dodatkowego niezmiennika. Znaczenie punktu odniesienia `position` — L07. Powiązanie: REQ-002, SPEC-002.

### D-008 — Statusy gry

`GameStatus = 'idle' | 'playing' | 'paused' | 'game-over'` (decyzja właściciela 2026-11-13). `paused` dotyczy trybu single-player; multiplayer go nie używa. Przejścia między statusami — poza lekcją 06. Powiązanie: REQ-002, SPEC-002.

### D-009 — Górny limit wymiarów planszy

`boardWidth` i `boardHeight` mieszczą się w zakresie `1..30` (decyzja właściciela 2026-11-13). Limit chroni przed kosztowną alokacją przy niezaufanej konfiguracji; standardowa plansza 10 × 20 mieści się z zapasem. Stała `MAX_BOARD_DIMENSION` jest wewnętrzna (nie należy do publicznego API). Powiązanie: REQ-003, SPEC-004.

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
  index.ts                  # publiczne eksporty
  piece.ts                  # PieceKind, Rotation, Position, ActivePiece
  board.ts                  # Cell, BoardRow, Board
  game-config.ts            # GameConfig i prywatny walidator (TASK-002)
  game-state.ts             # GameStatus, GameState
  create-initial-state.ts   # createInitialGameState (TASK-003)
  *.test.ts                 # testy obok implementacji
```

Struktura płaska (decyzja właściciela 2026-11-13): cały pakiet jest domeną, więc katalog `domain/` niczego nie oddziela. Podział `piece.ts` / `board.ts` odpowiada przyszłym właścicielom zmian (L07–L09).

## Alternatywy i kompromisy

| Opcja | Decyzja | Powód |
|---|---|---|
| Jeden globalny stan gry i meczu | Odrzucona | Silne sprzężenie multiplayera z silnikiem |
| `GameState` na gracza, przyszły `MatchState` osobno | Wybrana | Reużywalność i testowalność |
| Mutacja publicznego stanu | Odrzucona jako domyślna | Ryzyko efektów ubocznych i błędów replay |
| Osobna publiczna fabryka konfiguracji | Odłożona | YAGNI; jedna granica walidacji wystarcza |
| Pełny discriminated union | Odłożony | Brak potwierdzonych reguł wszystkich faz gry |

## Ryzyka / kwestie do rozstrzygnięcia

1. **Rozstrzygnięte (2026-11-13):** minimalny kształt `Board` i `ActivePiece` — D-006, D-007.
2. **Rozstrzygnięte (2026-11-13):** `GameStatus` obejmuje `paused` i `game-over` — D-008.
3. **Rozstrzygnięte (2026-11-13):** górny limit wymiaru planszy = 30 — D-009.
4. Głębokie `readonly` w tablicach nie zabezpiecza przed mutacją runtime z użyciem `as`.
5. Jeżeli w L07 `boardHeight` ma obejmować ukryty bufor nad widoczną planszą (np. 20 + 20), limit 30 będzie niewystarczający — wymaga ponownej decyzji w L07.

## Weryfikacja

Testy Vitest i przegląd typów/eksportów; uruchomienie `yarn check` po implementacji. Wyników nie oznaczono jako PASS przed wykonaniem.
