# Lekcja 06 — Model domenowy i stan gry: wymagania

**Status:** Approved (wymagania REQ-001–REQ-005 zatwierdzone przez właściciela w rozmowie; zapis w repozytorium oczekuje na PR)  
**Zakres:** `packages/game-engine`  
**Poza zakresem:** ruch, kolizje, obrót/SRS, generowanie figur, punktowanie zdarzeń, WebSocket i mechanika meczu.

## Cel

Ustanowić minimalny, niezależny od infrastruktury kontrakt stanu **jednej** gry Tetris oraz deterministyczną fabrykę stanu początkowego. `MatchState` i zasady pojedynku pozostają poza zakresem tej lekcji.

## Wymagania

### REQ-001 — Izolacja domeny
`GameState` i jego publiczne API MUST być niezależne od Reacta, Canvas, Expressa, WebSocket oraz identyfikatorów połączeń (np. `socketId`).

### REQ-002 — Podstawowy model stanu
`GameState` MUST reprezentować planszę (`board`), aktywną figurę (`activePiece`), wynik (`score`) i status (`status`) jednej gry. Szczegóły geometrii planszy i tetromino MAY zostać doprecyzowane w lekcji 07 bez implementowania mechaniki gry w lekcji 06.

### REQ-003 — Kontrolowana i deterministyczna inicjalizacja
Publiczna fabryka `createInitialGameState(config)` MUST tworzyć równoważne wartości stanów dla równoważnej poprawnej konfiguracji, bez ukrytych odczytów czasu ani losowości. MUST walidować konfigurację przed utworzeniem stanu.

### REQ-004 — Niemutowalne API
Publiczne kontrakty MUST chronić stan przed przypadkową mutacją na poziomie TypeScript. Każda publiczna operacja zmiany stanu, jeśli zostanie wprowadzona w tej lekcji, MUST pozostawić wejście bez zmian. Nie wymaga się implementowania przejść gry wykraczających poza zakres lekcji.

### REQ-005 — Testowalne niezmienniki
Testy MUST weryfikować stan początkowy, poprawność walidacji, deterministyczność i niezmienniki ustalone w tej specyfikacji. Należy odróżniać gwarancje kompilatora od walidacji runtime.

## Granice zakresu i ryzyka

- `Board` i `ActivePiece` są częścią kontraktu; ich szczegółowy model zostanie dopracowany w lekcji 07.
- Nie tworzymy figury w fabryce stanu początkowego; `activePiece = null`.
- Nie deklarujemy, że `playing` zawsze wymaga figury — taka reguła potrzebuje osobnej decyzji domenowej.
- Nie wprowadzamy przedwcześnie `MatchState`, RNG, SRS ani ruchu.

## Mapa śledzenia

| Wymaganie | Specyfikacje | Kryteria akceptacji |
|---|---|---|
| REQ-001 | SPEC-001 | AC-001 |
| REQ-002 | SPEC-002 | AC-002 |
| REQ-003 | SPEC-003, SPEC-004 | AC-003, AC-004 |
| REQ-004 | SPEC-005 | AC-005 |
| REQ-005 | SPEC-006 | AC-003, AC-004, AC-005 |
