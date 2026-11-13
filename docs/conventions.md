# Konwencje dokumentacyjne

Zasady procesu SDD, stacku i bezpieczeństwa zmian opisuje [`AGENTS.md`](../AGENTS.md) — ten dokument ich nie powtarza, tylko ustala format dokumentów.

## 1. Struktura

| Ścieżka | Zawartość |
|---|---|
| `specs/NNN-short-slug/` | pakiet SDD jednej zmiany: `requirements.md`, `spec.md`, `design.md`, `tasks.md` |
| `docs/templates/sdd/` | [szablony](./templates/sdd/) do skopiowania przy nowej zmianie |
| `docs/adr/` | decyzje architektoniczne (ADR) |
| `progress.md` | stan lekcji i rejestr ADR — aktualizowany po zgodzie właściciela |

`NNN` = numer lekcji (trzy cyfry); `short-slug` = 2–4 słowa po angielsku, kebab-case. Gałąź: `feature/NNN-short-slug`.

## 2. Język i styl

- Treść opisowa po polsku; nazwy plików, identyfikatory, kod i terminy techniczne po angielsku.
- Krótko: ok. 5 wymagań, 5 kryteriów, 5–6 zadań na zmianę. Tabela lub lista zamiast prozy.
- Odwołuj się linkiem zamiast kopiować treść z innego dokumentu.
- Nie opisuj planowanych funkcji jako istniejących — wskaż lekcję, w której powstaną.
- Pominięcie artefaktu SDD wymaga jednego zdania uzasadnienia w `requirements.md`.

## 3. Identyfikatory i śledzenie

| Prefiks | Definiowany w | Znaczenie |
|---|---|---|
| `REQ-NNN` | `requirements.md` | wymaganie |
| `SPEC-NNN` | `spec.md` | kontrakt / zachowanie realizujące wymagania |
| `AC-NNN` | `spec.md` | sprawdzalne kryterium akceptacji |
| `D-NNN` | `design.md` | decyzja projektowa w obrębie zmiany |
| `TASK-NNN` | `tasks.md` | zadanie implementacyjne |
| `Q-NNN` | `design.md` | otwarta kwestia do decyzji |

Łańcuch: **REQ → SPEC → TASK → AC**. Każdy `SPEC` wskazuje swoje `REQ`, każde `AC` swój `SPEC`, każdy `TASK` swoje `REQ` i `AC`. Każde `REQ` musi mieć co najmniej jeden `TASK` i jedno `AC`. ID są unikalne w obrębie katalogu zmiany; odwołanie do innej zmiany: `004/REQ-002`.

**Legacy:** `specs/001`–`003` używają `R-01`, `S-01`, `T-01`, `FR-01`, `NFR-01`. Nie migrujemy ich.

## 4. Statusy

| Obiekt | Statusy |
|---|---|
| Dokument SDD | `Draft` → `Approved` (z datą i osobą zatwierdzającą) → `Superseded` |
| Zadanie | `TODO` → `IN_PROGRESS` → `DONE` / `BLOCKED` |
| Wynik weryfikacji | `PASS` / `FAIL` / `NOT_RUN` (z powodem) |
| ADR | `Proposed` → `Accepted` / `Rejected`; później `Superseded by ADR-NNN` / `Deprecated` |

Zmianę statusu na `Approved` lub `Accepted` wykonuje się wyłącznie po decyzji właściciela.

## 5. ADR

**Kiedy tworzyć:** decyzja trudna do odwrócenia, wpływająca na wiele modułów, wybór technologii ze stacku, kontrakt między komponentami lub świadome odstępstwo od `AGENTS.md`. **Nie** dla drobnych konwencji, nazw czy wyborów lokalnych dla jednego modułu — te trafiają do `D-NNN` w `design.md`.

**Plik:** `docs/adr/ADR-NNN-short-slug.md`. Numery ADR-001–ADR-005 są zarezerwowane dla kandydatów z [`specs/001-mvp-architecture/design.md`](../specs/001-mvp-architecture/design.md) §7; nowe decyzje od ADR-006. Numerów nie używa się ponownie.

**Sekcje (w tej kolejności):** metadane (Status, Data, Powiązania), Context, Decision, Alternatives, Consequences. Status jest w metadanych, aby był widoczny od razu.

**Zmiana decyzji:** nie edytujemy treści zaakceptowanego ADR — tworzymy nowy, a stary oznaczamy `Superseded by ADR-NNN`.

Przykład: [ADR-003 — Server-authoritative multiplayer](./adr/ADR-003-server-authoritative-multiplayer.md).
