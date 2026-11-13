# Tasks — Lesson 005: CI Quality Gates

**Status:** Approved — zatwierdzono przez właściciela 2026-11-13  
**Design:** [design.md](./design.md)  
**Branch:** `feature/005-ci-quality-gates`

Status zadania: `TODO` → `IN_PROGRESS` → `DONE` / `BLOCKED`.

## Zadania

| ID | Zadanie | REQ | AC | Status |
|---|---|---|---|---|
| TASK-001 | Dodać ESLint dla trzech workspace'ów, skrypty `lint` i zadanie Turborepo; wdrożyć side-by-side TS 6/7 (D-002) i potwierdzić działanie na rzeczywistym kodzie; nie ukrywać błędów przez globalne wyłączenie reguł. | REQ-001 | AC-001, AC-002 | TODO |
| TASK-002 | Dodać markdownlint-cli2; zebrać raport naruszeń, uzgodnić reguły i zakres korekt; nie zmieniać zatwierdzonych specyfikacji bez osobnej zgody. | REQ-001 | AC-001, AC-002 | TODO |
| TASK-003 | Utworzyć workflow `pull_request` do `main` dla `opened`, `reopened`, `synchronize`, `edited`: sześć niezależnych jobów `constraints`, `lint-ts`, `lint-markdown`, `typecheck`, `test`, `build`, bez `needs` i filtrów pomijających wymagane checks. Każdy job: checkout, Node 26, Yarn 4.18.1, `yarn install --immutable`; wspólne kroki/cache Yarn tylko jako bezpieczna optymalizacja. Zweryfikować uprawnienia `contents: read` i brak sekretów. | REQ-001, REQ-002, REQ-004 | AC-001, AC-003, AC-005 | TODO |
| TASK-004 | Dodać kompletne lokalne `yarn check` obejmujące constraints, lint TypeScript, lint Markdown, typecheck, testy i build; zachować graf `^build` i pełny zakres workspace'ów. Wykonać test negatywny: (1) zielony przebieg, (2) niezgodna zmiana publicznego API `game-engine`, (3) ponowny typecheck zależnego workspace'a i dowód błędu bez nieaktualnego cache, (4) przywrócenie kodu. Bez zdalnego cache Turborepo. | REQ-001, REQ-003 | AC-001, AC-002, AC-004 | TODO |
| TASK-005 | Przygotować listę sześciu wymaganych status checks i sprawdzić aktualną ochronę `main`. Zmiana GitHub Rulesets/branch protection wymaga wyraźnej zgody właściciela i właściwych uprawnień; po autoryzacji skonfigurować i przetestować blokadę merge dla każdego nieudanego checka. Bez dostępu/zgody: zadanie `BLOCKED`, AC-006 `NOT_RUN`, bez deklarowania `PASS`. | REQ-005 | AC-006 | TODO |
| TASK-006 | Przeprowadzić testy pozytywne i negatywne dla AC-001–AC-006, review bezpieczeństwa i zakresu zmian, oraz sporządzić raport dowodów: scenariusz/polecenie, oczekiwany wynik, wynik rzeczywisty, status `PASS`/`FAIL`/`NOT_RUN` (z powodem), odnośnik do logów lub CI. Zweryfikować ścieżki REQ → SPEC → TASK → AC; nie zamykać lekcji bez kompletu dowodów i review PR. | REQ-001, REQ-002, REQ-003, REQ-004, REQ-005 | AC-001–AC-006 | TODO |

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

## Definition of Done

- AC-001–AC-006 mają wynik `PASS`, a PR przeszedł review.
- Zmiany ograniczono do zatwierdzonego zakresu; żadnego nieuzgodnionego masowego formatowania.
- `progress.md` aktualizujemy dopiero po weryfikacji i zgodzie właściciela.
