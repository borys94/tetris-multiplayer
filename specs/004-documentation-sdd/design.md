# Design — Lesson 004

**Status:** Approved — zatwierdzono przez właściciela 2026-11-13  
**Specification:** [spec.md](./spec.md)

## 1. Rozwiązanie

Dokumentację dzielimy na trzy obszary:

- `docs/conventions.md` — zasady dokumentowania zmian i tworzenia ADR.
- `docs/adr/` — historia decyzji architektonicznych.
- `docs/templates/sdd/` — szablony wykorzystywane przy nowych zmianach.

Każda zmiana SDD ma własny katalog `specs/NNN-short-slug/`. `AGENTS.md` pozostaje źródłem zasad procesu i stacku; `docs/conventions.md` odwołuje się do niego zamiast go powtarzać.

## 2. Decyzje projektowe

**D-001 — Oddzielenie szablonów od specyfikacji**

Szablony przechowujemy w `docs/templates/sdd/`, a dokumenty konkretnych zmian w `specs/`.

**D-002 — Markdown i Git**

Dokumentacja jest wersjonowana razem z kodem. Przegląd dokumentacji odbywa się przez Pull Request.

**D-003 — Lekkie traceability**

Stosujemy identyfikatory `REQ`, `SPEC`, `TASK` i `AC`. Powiązania zapisujemy bezpośrednio w dokumentach, bez dodatkowego narzędzia. AC definiujemy raz, w `spec.md`.

**D-004 — Nowy schemat ID bez migracji**

Schemat `REQ-NNN` obowiązuje od lekcji 004. `specs/001`–`003` (`R-01`, `S-01`, `T-01`, `FR-01`…) zostają bez zmian — są zatwierdzone, a migracja nie wnosi wartości. Konwencje opisują stary schemat jako legacy.

**D-005 — Numeracja ADR zgodna z kandydatami z L01**

Plik `docs/adr/ADR-NNN-short-slug.md`. Numery ADR-001–ADR-005 są zarezerwowane dla kandydatów z `specs/001-mvp-architecture/design.md` §7; nowe decyzje dostają kolejne wolne numery (od ADR-006). Luki w numeracji są dopuszczalne do czasu formalizacji.

## 3. Alternatywy

- `specs/_templates/` — odrzucone na rzecz oddzielenia wzorców od konkretnych zmian.
- Migracja ID w `specs/001`–`003` — zmiana zatwierdzonych dokumentów bez korzyści.
- Numeracja ADR od 001 według kolejności formalizacji — rozjechałaby się z odwołaniami w 001.
- Generator dokumentacji lub rozbudowany system śledzenia wymagań — nieproporcjonalne do skali projektu.

## 4. Ryzyka i ograniczenia

- **Duplikowanie dokumentacji:** przed utworzeniem pliku sprawdzamy, czy odpowiednik już istnieje.
- **Dwa schematy ID:** do czasu ewentualnej migracji czytelnik musi znać oba; opisane w konwencjach.
- **Nieaktualne szablony:** zmiany konwencji wymagają przeglądu szablonów.
- **Nadmierna formalizacja:** dla małych zmian dopuszczamy uzasadnione uproszczenia.

Nie zmieniamy kodu aplikacji ani konfiguracji infrastruktury.

## 5. Otwarte kwestie

- **Q-001:** zatwierdzenie ADR-003 — **rozstrzygnięte 2026-11-13:** `Accepted` (właściciel).
- **Q-002:** formalizacja ADR-001, 002, 004, 005 i kandydatów z L03 — osobna zmiana.
- **Q-003:** K-01 (Fastify w 001 vs Express w `AGENTS.md`) — **rozstrzygnięte 2026-11-13:** Express (decyzja właściciela). Formalny ADR (ADR-006) i korekta wzmianek o Fastify w `specs/001` — osobna zmiana.
- **Q-004:** rejestr ADR w `progress.md` — **rozstrzygnięte 2026-11-13:** zgoda właściciela, uzupełniono.
