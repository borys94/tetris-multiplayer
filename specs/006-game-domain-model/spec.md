# Lekcja 06 — Model domenowy i stan gry: specyfikacja zachowania

**Status:** Approved — zatwierdzono przez właściciela 2026-11-13  
**Wymagania źródłowe:** `requirements.md`

## Kontrakty

### SPEC-001 — Niezależność modułu (REQ-001)

Publiczne typy i fabryka w `@tetris/game-engine` nie importują warstw UI, serwera ani transportu. W `GameState` nie występuje `socketId`.

### SPEC-002 — Reprezentacja stanu (REQ-002)

Publiczny `GameState` udostępnia co najmniej `readonly board`, `readonly activePiece`, `readonly score`, `readonly status`. `activePiece` dopuszcza `null`. `GameStatus` jawnie określa dopuszczone statusy: `idle`, `playing`, `paused`, `game-over` (zatwierdzone 2026-11-13; `paused` dla single-player — design D-008). Typy `Board` i `ActivePiece` muszą być spójne i kompilowalne, bez implementowania zasad planszy i figur z lekcji 07 (kształt: design D-006, D-007).

### SPEC-003 — Stan początkowy (REQ-003)

Dla poprawnej konfiguracji `createInitialGameState(config)` zwraca stan z `status = "idle"`, `score = 0`, `activePiece = null` i pustą planszą zgodną z przyjętym kontraktem. Dwa wywołania z równoważną konfiguracją zwracają głęboko równoważne wartości. Fabryka nie odczytuje czasu ani nie losuje figury.

### SPEC-004 — Walidacja konfiguracji (REQ-003)

`GameConfig` zawiera `boardWidth` i `boardHeight`. Każdy wymiar musi być dodatnią bezpieczną liczbą całkowitą nie większą niż 30 (`Number.isSafeInteger(value) && value > 0 && value <= 30`; limit — decyzja właściciela 2026-11-13, design D-009). Dla `0`, liczb ujemnych, ułamków, `NaN`, `Infinity`, liczb spoza bezpiecznego zakresu i wartości powyżej 30 fabryka zgłasza `RangeError`; nie dokonuje cichej korekty wartości.

### SPEC-005 — Niemutowalność (REQ-004)

Kontrakty wykorzystują `readonly` również w strukturach zagnieżdżonych. Fabryka nie modyfikuje obiektu konfiguracji. Jeżeli zostaną dodane przejścia stanu, nie mogą mutować przekazanego stanu ani jego zagnieżdżonych danych. Sam operator spread nie wystarcza do ochrony zagnieżdżonych tablic.

### SPEC-006 — Niezmienniki i testy (REQ-005)

Testy sprawdzają: wynik początkowy równy zero, poprawny status początkowy, brak aktywnej figury, poprawne wymiary pustej planszy, odrzucanie niepoprawnych wymiarów, powtarzalność inicjalizacji oraz brak mutacji konfiguracji. Nie testujemy niezaimplementowanych przejść gry.

## Kryteria akceptacji

| ID | Powiązanie | Weryfikacja |
|---|---|---|
| AC-001 | SPEC-001 | Przegląd zależności i importów modułu; brak `socketId` w publicznym stanie; `yarn check` |
| AC-002 | SPEC-002 | Testy typów / kompilacja TS oraz przegląd eksportów `@tetris/game-engine` |
| AC-003 | SPEC-003, SPEC-006 | Test: dwa wywołania dla tego samego config dają `toEqual`; test pól stanu początkowego |
| AC-004 | SPEC-004, SPEC-006 | Parametryzowane testy `RangeError` dla `0`, `-10`, `1.5`, `NaN`, `Infinity`, `Number.MAX_SAFE_INTEGER + 1`, `31`; wartości graniczne `1` i `30` są poprawne |
| AC-005 | SPEC-005, SPEC-006 | Test niemutowania wejściowej konfiguracji; statyczne `readonly`; test niemutowania stanu dla operacji, o ile powstaną w lekcji 06 |

## Warunki zakończenia

- Wszystkie AC mają wskazany dowód w testach lub przeglądzie.
- `yarn check` kończy się powodzeniem w odpowiednim środowisku.
- Brak niezatwierdzonych zmian zakresu.
- PR przechodzi review; status ukończenia lekcji wymaga decyzji właściciela.
