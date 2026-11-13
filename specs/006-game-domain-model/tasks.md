# Lekcja 06 — Model domenowy i stan gry: plan zadań

**Status dokumentu:** Draft — do zatwierdzenia przed implementacją  
**Gałąź sugerowana:** `feature/006-game-domain-model`  
**Stan wykonania:** wszystkie zadania TODO; testy NOT_RUN.

## Zadania

### TASK-001 — Kontrakty domenowe
- **Status:** TODO
- **Śledzenie:** REQ-001, REQ-002 → SPEC-001, SPEC-002 → AC-001, AC-002
- Przejrzeć istniejące API `packages/game-engine` i konwencje repozytorium.
- Uzgodnić minimalne, kompilowalne typy `GameConfig`, `GameStatus`, `GameState`, `Board`, `ActivePiece`.
- Wyeksportować publiczne kontrakty bez zależności od UI i sieci.
- **Dowód:** przegląd API, kompilacja TS. **Wynik:** NOT_RUN.

### TASK-002 — Walidacja GameConfig
- **Status:** TODO
- **Śledzenie:** REQ-003, REQ-005 → SPEC-004, SPEC-006 → AC-004
- Walidować dodatnie bezpieczne liczby całkowite w fabryce.
- Zwracać `RangeError` dla błędnych wymiarów; bez cichej korekty.
- **Dowód:** testy przypadków poprawnych i brzegowych. **Wynik:** NOT_RUN.

### TASK-003 — Fabryka stanu początkowego
- **Status:** TODO
- **Śledzenie:** REQ-003 → SPEC-003 → AC-003
- Zaimplementować `createInitialGameState(config)` z `idle`, `score = 0`, `activePiece = null`, pustą planszą.
- Nie używać losowości, czasu ani infrastruktury.
- **Dowód:** test stanu początkowego i powtarzalności. **Wynik:** NOT_RUN.

### TASK-004 — Testy deterministyczności i walidacji
- **Status:** TODO
- **Śledzenie:** REQ-003, REQ-005 → SPEC-003, SPEC-004, SPEC-006 → AC-003, AC-004
- Parametryzowane testy Vitest dla `0`, wartości ujemnych, ułamków, `NaN`, `Infinity` i wartości spoza safe integer.
- Test równoważności stanów dla równoważnych konfiguracji.
- **Dowód:** wynik Vitest. **Wynik:** NOT_RUN.

### TASK-005 — Testy niezmienników i niemutowalności
- **Status:** TODO
- **Śledzenie:** REQ-004, REQ-005 → SPEC-005, SPEC-006 → AC-005
- Sprawdzić `score = 0`, `status = idle`, `activePiece = null` i rozmiar pustej planszy.
- Sprawdzić, że fabryka nie zmienia konfiguracji wejściowej; skontrolować `readonly` struktur zagnieżdżonych.
- Nie tworzyć fikcyjnych przejść stanu tylko dla testów.
- **Dowód:** Vitest, typecheck, review. **Wynik:** NOT_RUN.

### TASK-006 — Kontrola jakości i PR
- **Status:** TODO
- **Śledzenie:** REQ-001, REQ-005 → SPEC-001, SPEC-006 → AC-001, AC-002, AC-005
- Uruchomić `yarn check`; zapisać faktyczne wyniki i ewentualne problemy.
- Sprawdzić zakres diffu, publiczne eksporty, brak zależności infrastrukturalnych i zgodność z AGENTS.md.
- Przygotować PR; nie wykonywać merge bez zgody właściciela.
- **Dowód:** logi kontroli i link do PR. **Wynik:** NOT_RUN.

## Macierz weryfikacji

| AC | Zadania | Metoda | Wynik |
|---|---|---|---|
| AC-001 | TASK-001, TASK-006 | Review importów i API | NOT_RUN |
| AC-002 | TASK-001, TASK-006 | Typecheck, review eksportów | NOT_RUN |
| AC-003 | TASK-003, TASK-004 | Vitest: stan początkowy i powtarzalność | NOT_RUN |
| AC-004 | TASK-002, TASK-004 | Vitest: niepoprawne wymiary | NOT_RUN |
| AC-005 | TASK-005, TASK-006 | Vitest, typecheck, review niemutowalności | NOT_RUN |

## Warunki zamknięcia

Wszystkie zadania DONE, AC zweryfikowane, PR zrecenzowany, zgoda właściciela na zamknięcie lekcji. Dopiero wtedy aktualizacja `progress.md`. Nie utożsamiać przygotowania specyfikacji z ukończeniem lekcji.
