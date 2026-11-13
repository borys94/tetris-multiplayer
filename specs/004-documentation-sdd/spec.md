# Specification — Lesson 004

**Status:** Approved — zatwierdzono przez właściciela 2026-11-13  
**Requirements:** [requirements.md](./requirements.md)

## 1. Kontrakty

**SPEC-001 — Szablony SDD (REQ-001, REQ-005)**

W `docs/templates/sdd/` muszą istnieć cztery szablony:

- `requirements.md` — cel, zakres, wymagania, kryteria akceptacji.
- `spec.md` — kontrakty, przypadki brzegowe, weryfikacja.
- `design.md` — rozwiązanie, alternatywy, ryzyka.
- `tasks.md` — zadania, powiązania z wymaganiami, weryfikacja.

Każdy szablon zawiera krótkie wskazówki dotyczące jego wypełniania.

**SPEC-002 — Konwencje (REQ-002, REQ-005)**

`docs/conventions.md` definiuje nazewnictwo, statusy, identyfikatory (`REQ`, `SPEC`, `TASK`, `AC`) i zasady powiązań między dokumentami. Schemat obowiązuje od lekcji 004; `specs/001`–`003` zachowują dotychczasowe ID.

Treść opisowa jest po polsku, a nazwy plików i identyfikatory po angielsku.

**SPEC-003 — ADR (REQ-003, REQ-004)**

Konwencje określają, kiedy tworzyć ADR i jakie sekcje powinien zawierać: Context, Decision, Alternatives, Consequences, Status.

Powstaje `docs/adr/ADR-003-server-authoritative-multiplayer.md` (numer zgodny z kandydatem z `specs/001-mvp-architecture/design.md` §7) ze statusem `Proposed`; zmiana na `Accepted` tylko po decyzji właściciela (zaakceptowano 2026-11-13).

## 2. Przypadki brzegowe

- Nie duplikujemy istniejących dokumentów.
- Nie tworzymy ADR dla drobnych konwencji.
- Pominięcie artefaktu SDD wymaga krótkiego uzasadnienia.
- Nie przedstawiamy planowanych funkcji jako zaimplementowanych.

## 3. Weryfikacja

| AC | Kryterium | SPEC | Metoda |
|---|---|---|---|
| AC-001 | Cztery szablony istnieją i zawierają wymagane sekcje. | SPEC-001 | review + `grep` nagłówków |
| AC-002 | Konwencje dokumentacyjne są opisane. | SPEC-002 | review |
| AC-003 | Format ADR i przykład są kompletne. | SPEC-003 | review sekcji ADR-003 |
| AC-004 | Każde wymaganie ma przypisane zadanie i sposób weryfikacji. | SPEC-001–003 | macierz w `tasks.md` |
| AC-005 | Odnośniki są poprawne, a zmiany ograniczone do uzgodnionego zakresu. | SPEC-001–003 | skrypt linków + `git diff --stat` |
| AC-006 | Wyniki przeglądu i kontroli zostały zapisane. | — | raport w PR |
