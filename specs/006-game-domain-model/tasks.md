# Lekcja 06 — Model domenowy i stan gry: plan zadań

**Status dokumentu:** Approved — zatwierdzono przez właściciela 2026-11-13  
**Gałąź sugerowana:** `feature/006-game-domain-model`  
**Stan wykonania:** TASK-001–TASK-006 DONE; review PR i decyzja o zamknięciu — właściciel.

## Zadania

### TASK-001 — Kontrakty domenowe

- **Status:** DONE (2026-11-13)
- **Śledzenie:** REQ-001, REQ-002 → SPEC-001, SPEC-002 → AC-001, AC-002
- Przejrzeć istniejące API `packages/game-engine` i konwencje repozytorium.
- Uzgodnić minimalne, kompilowalne typy `GameConfig`, `GameStatus`, `GameState`, `Board`, `ActivePiece`.
- Wyeksportować publiczne kontrakty bez zależności od UI i sieci.
- **Dowód:** przegląd API, kompilacja TS. **Wynik:** PASS lokalnie.
  - Pliki: `piece.ts`, `board.ts`, `game-config.ts`, `game-state.ts`, eksporty typów w `index.ts`, `contracts.test.ts` (`@ts-expect-error` przy mutacji pól, wyłącznie przez `./index.js`; odchudzony 2026-11-13 — usunięto asercje powielające definicje typów i dokładne `keyof GameState`, które blokowałoby rozszerzenia stanu w L07–L14).
  - AC-001: importy w `src/` tylko względne (`vitest` wyłącznie w testach, poza buildem); brak `socketId`, `react`, `express`, `ws`, `node:`; brak `dependencies`/`peerDependencies`.
  - AC-002: obecność i typy pól `GameState` potwierdza kompilacja `create-initial-state.test.ts` i przegląd eksportów; niemutowalność — testy negatywne: usunięcie `readonly` z `score`, `rows`, `BoardRow`, `Position.x`, `boardWidth` powoduje błąd `yarn typecheck` (TS2578) w odpowiedniej asercji; po przywróceniu exit 0.
  - `yarn install --immutable` = 0, `yarn check` = 0.

### TASK-002 — Walidacja GameConfig

- **Status:** DONE (2026-11-13)
- **Śledzenie:** REQ-003, REQ-005 → SPEC-004, SPEC-006 → AC-004
- Walidować dodatnie bezpieczne liczby całkowite w zakresie `1..30` (D-009) w fabryce.
- Zwracać `RangeError` dla błędnych wymiarów; bez cichej korekty.
- **Dowód:** testy przypadków poprawnych i brzegowych. **Wynik:** PASS — `game-config.ts` (`validateGameConfig`, `MAX_BOARD_DIMENSION = 30`, wewnętrzne); komunikat błędu wskazuje pole.

### TASK-003 — Fabryka stanu początkowego

- **Status:** DONE (2026-11-13)
- **Śledzenie:** REQ-003 → SPEC-003 → AC-003
- Zaimplementować `createInitialGameState(config)` z `idle`, `score = 0`, `activePiece = null`, pustą planszą.
- Nie używać losowości, czasu ani infrastruktury.
- **Dowód:** test stanu początkowego i powtarzalności. **Wynik:** PASS — `create-initial-state.ts`, eksport w `index.ts`; osobna tablica na każdy wiersz.

### TASK-004 — Testy deterministyczności i walidacji

- **Status:** DONE (2026-11-13)
- **Śledzenie:** REQ-003, REQ-005 → SPEC-003, SPEC-004, SPEC-006 → AC-003, AC-004
- Parametryzowane testy Vitest dla `0`, wartości ujemnych, ułamków, `NaN`, `Infinity` i wartości spoza safe integer.
- Test równoważności stanów dla równoważnych konfiguracji.
- **Dowód:** wynik Vitest. **Wynik:** PASS — `create-initial-state.test.ts`: 8 niepoprawnych wartości × 2 wymiary (dodatkowo `-Infinity`, `31`), granice `1` i `30`, `toEqual` dwóch wywołań, brak wywołań `Math.random`/`Date.now`.

### TASK-005 — Testy niezmienników i niemutowalności

- **Status:** DONE (2026-11-13)
- **Śledzenie:** REQ-004, REQ-005 → SPEC-005, SPEC-006 → AC-005
- Sprawdzić `score = 0`, `status = idle`, `activePiece = null` i rozmiar pustej planszy.
- Sprawdzić, że fabryka nie zmienia konfiguracji wejściowej; skontrolować `readonly` struktur zagnieżdżonych.
- Nie tworzyć fikcyjnych przejść stanu tylko dla testów.
- **Dowód:** Vitest, typecheck, review. **Wynik:** PASS — zamrożona (`Object.freeze`) konfiguracja przechodzi bez błędu i pozostaje równa kopii; stan nie trzyma referencji do konfiguracji; `readonly` zagnieżdżone — `contracts.test.ts`.

### TASK-006 — Kontrola jakości i PR

- **Status:** DONE (2026-11-13)
- **Śledzenie:** REQ-001, REQ-005 → SPEC-001, SPEC-006 → AC-001, AC-002, AC-005
- Uruchomić `yarn check`; zapisać faktyczne wyniki i ewentualne problemy.
- Sprawdzić zakres diffu, publiczne eksporty, brak zależności infrastrukturalnych i zgodność z AGENTS.md.
- Przygotować PR; nie wykonywać merge bez zgody właściciela.
- **Dowód:** logi kontroli i link do PR. **Wynik:** PASS.
  - Lokalnie: `yarn install --immutable` = 0; `yarn check` = 0 (12/12 zadań, 34 pliki Markdown bez naruszeń); Vitest `game-engine` 31/31 (po odchudzeniu `contracts.test.ts`; wcześniej 34/34).
  - CI: [PR #8](https://github.com/borys94/tetris-multiplayer/pull/8), [run 43475535510](https://github.com/borys94/tetris-multiplayer/actions/runs/43475535510) dla `bfbbd18` — 6/6 checks `success`.
  - Zakres: zmiany wyłącznie w `packages/game-engine/src` i `specs/006-game-domain-model/`. Publiczne eksporty runtime: `ENGINE_API_VERSION`, `createInitialGameState`; walidator i limit wewnętrzne. Brak zależności runtime i odwołań do czasu, losowości, transportu (`grep` źródeł bez testów).
  - Testy mutacyjne (ręczne, 10 defektów: limit ±1, akceptacja `0`, `isFinite` zamiast `isSafeInteger`, brak walidacji wysokości, `score` 1, status `playing`, współdzielony wiersz, zapis do konfiguracji, `Math.random`, zamiana wymiarów) — każdy wykryty przez co najmniej 1 test.

## Macierz weryfikacji

| AC | Zadania | Metoda | Wynik |
|---|---|---|---|
| AC-001 | TASK-001, TASK-006 | Review importów i API | PASS (lokalnie + [run 43475535510](https://github.com/borys94/tetris-multiplayer/actions/runs/43475535510)) |
| AC-002 | TASK-001, TASK-006 | Typecheck, review eksportów | PASS (lokalnie + [run 43475535510](https://github.com/borys94/tetris-multiplayer/actions/runs/43475535510)) |
| AC-003 | TASK-003, TASK-004 | Vitest: stan początkowy i powtarzalność | PASS (lokalnie + [run 43475535510](https://github.com/borys94/tetris-multiplayer/actions/runs/43475535510)) |
| AC-004 | TASK-002, TASK-004 | Vitest: niepoprawne wymiary | PASS (lokalnie + [run 43475535510](https://github.com/borys94/tetris-multiplayer/actions/runs/43475535510)) |
| AC-005 | TASK-005, TASK-006 | Vitest, typecheck, review niemutowalności | PASS (lokalnie + [run 43475535510](https://github.com/borys94/tetris-multiplayer/actions/runs/43475535510)) |

## Warunki zamknięcia

Wszystkie zadania DONE, AC zweryfikowane, PR zrecenzowany, zgoda właściciela na zamknięcie lekcji. Dopiero wtedy aktualizacja `progress.md`. Nie utożsamiać przygotowania specyfikacji z ukończeniem lekcji.
