# Tasks — Lesson 005: CI Quality Gates

**Status:** Approved — zatwierdzono przez właściciela 2026-11-13  
**Design:** [design.md](./design.md)  
**Branch:** `feature/005-ci-quality-gates`

Status zadania: `TODO` → `IN_PROGRESS` → `DONE` / `BLOCKED`.

## Zadania

| ID | Zadanie | REQ | AC | Status |
|---|---|---|---|---|
| TASK-001 | Dodać ESLint dla trzech workspace'ów, skrypty `lint` i zadanie Turborepo; wdrożyć side-by-side TS 6/7 (D-002) i potwierdzić działanie na rzeczywistym kodzie; nie ukrywać błędów przez globalne wyłączenie reguł. | REQ-001 | AC-001, AC-002 | DONE |
| TASK-002 | Dodać markdownlint-cli2; zebrać raport naruszeń, uzgodnić reguły i zakres korekt; nie zmieniać zatwierdzonych specyfikacji bez osobnej zgody. | REQ-001 | AC-001, AC-002 | DONE |
| TASK-003 | Utworzyć workflow `pull_request` do `main` dla `opened`, `reopened`, `synchronize`, `edited`: sześć niezależnych jobów `constraints`, `lint-ts`, `lint-markdown`, `typecheck`, `test`, `build`, bez `needs` i filtrów pomijających wymagane checks. Każdy job: checkout, Node 26, Yarn 4.18.1, `yarn install --immutable`; wspólne kroki/cache Yarn tylko jako bezpieczna optymalizacja. Zweryfikować uprawnienia `contents: read` i brak sekretów. | REQ-001, REQ-002, REQ-004 | AC-001, AC-003, AC-005 | DONE |
| TASK-004 | Dodać kompletne lokalne `yarn check` obejmujące constraints, lint TypeScript, lint Markdown, typecheck, testy i build; zachować graf `^build` i pełny zakres workspace'ów. Wykonać test negatywny: (1) zielony przebieg, (2) niezgodna zmiana publicznego API `game-engine`, (3) ponowny typecheck zależnego workspace'a i dowód błędu bez nieaktualnego cache, (4) przywrócenie kodu. Bez zdalnego cache Turborepo. | REQ-001, REQ-003 | AC-001, AC-002, AC-004 | DONE |
| TASK-005 | Przygotować listę sześciu wymaganych status checks i sprawdzić aktualną ochronę `main`. Zmiana GitHub Rulesets/branch protection wymaga wyraźnej zgody właściciela i właściwych uprawnień; po autoryzacji skonfigurować i przetestować blokadę merge dla każdego nieudanego checka. Bez dostępu/zgody: zadanie `BLOCKED`, AC-006 `NOT_RUN`, bez deklarowania `PASS`. | REQ-005 | AC-006 | DONE |
| TASK-006 | Przeprowadzić testy pozytywne i negatywne dla AC-001–AC-006, review bezpieczeństwa i zakresu zmian, oraz sporządzić raport dowodów: scenariusz/polecenie, oczekiwany wynik, wynik rzeczywisty, status `PASS`/`FAIL`/`NOT_RUN` (z powodem), odnośnik do logów lub CI. Zweryfikować ścieżki REQ → SPEC → TASK → AC; nie zamykać lekcji bez kompletu dowodów i review PR. | REQ-001, REQ-002, REQ-003, REQ-004, REQ-005 | AC-001–AC-006 | DONE |

## Weryfikacja

```bash
yarn install --immutable
yarn constraints
yarn lint
yarn typecheck
yarn test
yarn build
yarn check
```

`yarn lint` i rozszerzone `yarn check` są poleceniami **docelowymi**, nie istniejącymi obecnie gwarancjami. `yarn check` musi lokalnie wykonać constraints, oba rodzaje lintu, typecheck, testy i build; CI może uruchamiać te kontrole w sześciu niezależnych jobach. W raporcie należy odnotować zarówno wynik pełnego `yarn check`, jak i wyniki poszczególnych checks. Dowody testów negatywnych należy zachować bez pozostawiania celowych błędów w końcowym kodzie.

## Raport weryfikacji (2026-11-13)

PR: [#6](https://github.com/borys94/tetris-multiplayer/pull/6). Przebiegi CI: `https://github.com/borys94/tetris-multiplayer/actions/runs/<id>`. Celowe błędy wprowadzano osobnymi commitami `test(ci): …` i cofano commitami `Revert …`; końcowe drzewo jest identyczne ze stanem sprzed testów.

| AC | Scenariusz | Oczekiwane | Rzeczywiste | Status | Dowód |
|---|---|---|---|---|---|
| AC-001 | `opened`, `synchronize`, `reopened`, zmiana bazy `main` → `feature/004-close-lesson` → `main` | 6 checks przy każdym zdarzeniu do `main`; brak przebiegu dla bazy ≠ `main` | `opened` 6/6 ✓; `synchronize` — 6 jobów w każdym przebiegu; `reopened` 6/6 ✓; baza ≠ `main`: 0 przebiegów; powrót na `main`: 1 przebieg 6/6 ✓ | `PASS` | runs 43458396187, 43458610775, 43459276338, 43465133517 |
| AC-002 | `any` w `game-engine` + nagłówek bez pustej linii w `README.md`; potem revert | `lint-ts`, `lint-markdown` = failure; pozostałe niezależnie success; po revercie 6/6 | `no-explicit-any`, MD022/MD025; 4 pozostałe success; revert 6/6 ✓; lokalnie exit 1 → 0 | `PASS` | runs 43458610775 → 43458814402 |
| AC-003 | `vitest` 5.1.0 → 5.0.0 w `apps/web/package.json` bez aktualizacji `yarn.lock` | `yarn install --immutable` kończy się błędem | YN0028 we wszystkich 6 jobach; lokalnie exit 1 | `PASS` | run 43458963228 |
| AC-004 | Zielony `yarn typecheck` → zmiana nazwy eksportu w `game-engine` (z jego testem) → typecheck → przywrócenie | Cache miss dla zmienionego pakietu i konsumentów; błąd w `@tetris/web` i `@tetris/server` | Przebieg 1: 4/4 cache; przebieg 2: 4/4 cache miss, TS2724 w `web` i `server`, exit 1; przebieg 3: 4/4 cache, exit 0 | `PASS` | logi Turborepo (lokalnie); CI zawsze startuje bez cache Turborepo |
| AC-005 | Review YAML + logi jobów | `contents: read`, brak sekretów i `pull_request_target` | `GITHUB_TOKEN`: `Contents: read`, `Metadata: read`; brak odwołań do `secrets`; akcje przypięte do SHA; `persist-credentials: false` | `PASS` | `.github/`, run 43458396187 |
| AC-006 | Ruleset `main-quality-gates` (id 27215959) z 6 checks, bez bypass; commit psujący tylko `lint-markdown`; `gh pr merge 6 --merge` | Merge odrzucony | `mergeStateStatus: BLOCKED`; „the base branch policy prohibits the merge”; `main` bez zmian; po revercie `CLEAN` | `PASS` | run 43465294806; ruleset 27215959 |

**Uwagi:**

- AC-006: blokadę empirycznie sprawdzono dla jednego checka; wymaganie pozostałych pięciu potwierdza odczyt efektywnych reguł `main` (6 kontekstów, `integration_id` GitHub Actions). Ominięcia przez `--admin` nie testowano — ruleset nie ma bypass actors.
- Lokalnie: `yarn install --immutable` i `yarn check` (12/12 zadań, 30 plików Markdown, 0 naruszeń) = exit 0; `constraints`, `lint`, `typecheck`, `test`, `build` osobno = exit 0.
- Czas CI: przebieg 18–49 s (wall clock), job ok. 18–27 s; cel p95 ≤ 5 min mieści się z zapasem (pomiar z 9 przebiegów, bez cache zależności).
- Markdown: poza wyłączeniem MD013/MD060 dodano dwa wąskie wyjątki — MD036 (pogrubione etykiety ID jako konwencja SDD) i MD033 tylko dla `<nazwa>` w szablonach.
- `@typescript/typescript6@6.0.2` re-eksportuje `typescript@^6` (lockfile: 6.0.3). Instalacja zgłasza ostrzeżenie YN0066 (wbudowana łatka PnP Yarn dla `typescript` nie pasuje) — bez wpływu przy `nodeLinker: node-modules`. Wyhoistowany `node_modules/.bin/tsc` w root to TS 6; skrypty workspace'ów używają TS 7.0.2.
- `actionlint` nie został uruchomiony (blokada uruchamiania pobranej binarki); YAML zweryfikowano parserem i symulacją kroków composite action.

**Traceability:** REQ-001 → SPEC-001 → TASK-001–004 → AC-001, AC-002 · REQ-002 → SPEC-002 → TASK-003 → AC-003 · REQ-003 → SPEC-003 → TASK-004 → AC-004 · REQ-004 → SPEC-004 → TASK-003 → AC-005 · REQ-005 → SPEC-005 → TASK-005 → AC-006 · TASK-006 → AC-001–AC-006.

## Definition of Done

- AC-001–AC-006 mają wynik `PASS`, a PR przeszedł review.
- Zmiany ograniczono do zatwierdzonego zakresu; żadnego nieuzgodnionego masowego formatowania.
- `progress.md` aktualizujemy dopiero po weryfikacji i zgodzie właściciela.
