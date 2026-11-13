# Multiplayer Tetris — dziennik postępów

## Stan projektu

- **Ukończone lekcje:** 5/60
- **Aktualna lekcja:** 06
- **Etap:** M1 — Fundament inżynierski
- **Ostatnia aktualizacja:** 2026-11-13 — zamknięcie lekcji 05
- **Repozytorium / gałąź:** `borys94/tetris-multiplayer` / `main`
- **Środowiska:** lokalne — monorepo (`yarn install --immutable`, `yarn check`); CI — GitHub Actions na PR do `main` (6 wymaganych checks, ruleset `main-quality-gates`); aplikacje jeszcze nieuruchamialne; beta — nieuruchomione; produkcja — nieuruchomiona

## Statusy

`Nie rozpoczęto` · `W trakcie` · `Zablokowane` · `Do przeglądu` · `Ukończono`

## Lista lekcji

| Nr | Lekcja | Status | Specyfikacja / PR | Dowód weryfikacji | Uwagi |
|---|---|---|---|---|---|
| 01 | Analiza wymagań, MVP i architektura docelowa | Ukończono | `specs/001-mvp-architecture/` (`requirements.md` v0.2, `spec.md` v0.3, `design.md` v0.2, `tasks.md` v0.4) | [Commit dokumentacji](https://github.com/borys94/tetris-multiplayer/commit/7c421bd0a2d381a788a008717f0ab689754c220c); review T-01–T-06: PASS | `Lesson 01: CLOSED` — decyzja właściciela 2026-11-12; bez testów aplikacji |
| 02 | Test diagnostyczny i organizacja pracy z AI | Ukończono | `specs/002-ai-workflow/` (`requirements.md`, `spec.md`, `design.md`, `tasks.md` — `Approved`); [PR #1](https://github.com/borys94/tetris-multiplayer/pull/1) | Kontrole spójności ID R-01–R-05 / S-01–S-05 / T-01–T-06: PASS; symulacje S-01–S-05: PASS (S-02, S-03 dokumentacyjnie); testy/lint/typecheck: NOT_RUN (brak kodu aplikacji) | `Lesson 02: CLOSED` — decyzja właściciela 2026-11-13 po code review PR #1: PASS; „test diagnostyczny” nieobjęty specyfikacją 002 |
| 03 | Monorepo, TypeScript, Yarn i Turborepo | Ukończono | `specs/003-monorepo-tooling/` (`Approved`); [PR #2](https://github.com/borys94/tetris-multiplayer/pull/2) | S-01–S-05: PASS na świeżym klonie (`yarn check` 9/9, cache `FULL TURBO`, constraints i granice TS — scenariusze negatywne); CI: NOT_RUN (L05) | `Lesson 03: CLOSED` — merge PR #2 przez właściciela 2026-11-13 |
| 04 | Dokumentacja, ADR, konwencje i szablony SDD | Ukończono | `specs/004-documentation-sdd/` (`Approved`); `docs/conventions.md`, `docs/templates/sdd/`, `docs/adr/`; [PR #4](https://github.com/borys94/tetris-multiplayer/pull/4) | Linki (16) i kotwice: PASS; sekcje szablonów i ADR: PASS; traceability REQ-001–005 → SPEC → TASK → AC-001–006: PASS; zakres tylko dokumentacja: PASS; `yarn check` 9/9: PASS; lint Markdown: NOT_RUN (L05) | Od 004 schemat ID `REQ/SPEC/TASK/AC` (001–003 legacy); ADR-003 `Accepted`; K-01 → Express; `Lesson 04: CLOSED` — merge PR #4 przez właściciela 2026-11-13 |
| 05 | CI: lint, sprawdzanie typów, testy i kontrole PR | Ukończono | `specs/005-ci-quality-gates/` (`Approved`); `.github/workflows/ci.yml`; [PR #6](https://github.com/borys94/tetris-multiplayer/pull/6) | AC-001–AC-006: PASS (raport w `tasks.md`); przebiegi CI na PR #6 — pozytywne i negatywne; blokada merge przez ruleset potwierdzona; `yarn check` 12/12: PASS | ESLint + markdownlint-cli2; TS 6/7 side-by-side (D-002); `Lesson 05: CLOSED` — decyzja właściciela 2026-11-13, squash merge PR #6 |
| 06 | Model domenowy i stan gry | Nie rozpoczęto | — | — | — |
| 07 | Plansza, tetromino i układ współrzędnych | Nie rozpoczęto | — | — | — |
| 08 | Ruch, wykrywanie kolizji i granice planszy | Nie rozpoczęto | — | — | — |
| 09 | Obrót, SRS i wall kicks | Nie rozpoczęto | — | — | — |
| 10 | Generator 7-bag, kolejka następnych figur i ghost piece | Nie rozpoczęto | — | — | — |
| 11 | Grawitacja, pętla gry i stały krok czasowy | Nie rozpoczęto | — | — | — |
| 12 | Soft drop, hard drop i opóźnienie blokowania | Nie rozpoczęto | — | — | — |
| 13 | Hold piece i przejścia stanów | Nie rozpoczęto | — | — | — |
| 14 | Usuwanie linii, punktacja, combo i back-to-back | Nie rozpoczęto | — | — | — |
| 15 | Koniec gry, reset i testy właściwości | Nie rozpoczęto | — | — | — |
| 16 | Architektura Reacta i rozdzielenie odpowiedzialności | Nie rozpoczęto | — | — | — |
| 17 | Renderer Canvas, zmiana rozmiaru i wydajność | Nie rozpoczęto | — | — | — |
| 18 | Sterowanie klawiaturą, DAS i ARR | Nie rozpoczęto | — | — | — |
| 19 | HUD, ustawienia, kolejka figur, hold i dźwięk | Nie rozpoczęto | — | — | — |
| 20 | Dostępność, testy E2E Playwright i wydanie single-player | Nie rozpoczęto | — | — | — |
| 21 | Express, REST API, walidacja i obsługa błędów | Nie rozpoczęto | — | — | — |
| 22 | PostgreSQL, Drizzle, migracje i repozytoria | Nie rozpoczęto | — | — | — |
| 23 | Uwierzytelnianie, autoryzacja i profile | Nie rozpoczęto | — | — | — |
| 24 | Historia meczów, statystyki graczy i transakcje | Nie rozpoczęto | — | — | — |
| 25 | Testy integracyjne, Docker Compose i kontrakty API | Nie rozpoczęto | — | — | — |
| 26 | Protokół WebSocket, kontrakty Zod i cykl życia połączenia | Nie rozpoczęto | — | — | — |
| 27 | Autorytatywny silnik serwerowy i sekwencjonowanie wejścia | Nie rozpoczęto | — | — | — |
| 28 | Pokoje, zaproszenia, odliczanie i sesje meczów | Nie rozpoczęto | — | — | — |
| 29 | Linie karne, ataki, zwycięstwo i porażka | Nie rozpoczęto | — | — | — |
| 30 | Ponowne połączenie, snapshoty, predykcja i uzgadnianie stanu | Nie rozpoczęto | — | — | — |
| 31 | Redis, obecność graczy, kolejka matchmakingu i TTL | Nie rozpoczęto | — | — | — |
| 32 | System rankingowy, matchmaking rankingowy i uczciwość | Nie rozpoczęto | — | — | — |
| 33 | Tablice wyników, rankingi i interfejs historii meczów | Nie rozpoczęto | — | — | — |
| 34 | Tryb obserwatora i ograniczenia widoczności | Nie rozpoczęto | — | — | — |
| 35 | Dziennik zdarzeń, replay i weryfikacja determinizmu | Nie rozpoczęto | — | — | — |
| 36 | Architektura AWS, IAM, bezpieczeństwo i koszty | Nie rozpoczęto | — | — | — |
| 37 | Moduły Terraform, zdalny stan i środowiska | Nie rozpoczęto | — | — | — |
| 38 | VPC, sieć, grupy bezpieczeństwa i ALB | Nie rozpoczęto | — | — | — |
| 39 | ECS Fargate, ECR, RDS i ElastiCache | Nie rozpoczęto | — | — | — |
| 40 | S3, CloudFront, Route 53, TLS i sekrety | Nie rozpoczęto | — | — | — |
| 41 | Pipeline CI, cache i strategia testów | Nie rozpoczęto | — | — | — |
| 42 | Budowanie obrazów Docker, skanowanie i publikacja do ECR | Nie rozpoczęto | — | — | — |
| 43 | Wdrożenie beta, OIDC i migracje bazy | Nie rozpoczęto | — | — | — |
| 44 | Zatwierdzanie produkcji, wydania i wycofywanie zmian | Nie rozpoczęto | — | — | — |
| 45 | Smoke testy, tagi wydań i weryfikacja wdrożeń | Nie rozpoczęto | — | — | — |
| 46 | SLI, SLO oraz metryki RED i USE | Nie rozpoczęto | — | — | — |
| 47 | Instrumentacja OpenTelemetry i śledzenie rozproszone | Nie rozpoczęto | — | — | — |
| 48 | Metryki zgodne z Prometheusem, Grafana i dashboardy | Nie rozpoczęto | — | — | — |
| 49 | Logi strukturalne, alerty i reagowanie na incydenty | Nie rozpoczęto | — | — | — |
| 50 | Testy obciążeniowe, planowanie pojemności i eksperymenty awaryjne | Nie rozpoczęto | — | — | — |
| 51 | Modelowanie zagrożeń, OWASP i bezpieczeństwo WebSocket | Nie rozpoczęto | — | — | — |
| 52 | Anti-cheat, ograniczanie ruchu i przeciwdziałanie nadużyciom | Nie rozpoczęto | — | — | — |
| 53 | Profilowanie pętli gry, wydajność klienta i opóźnienia | Nie rozpoczęto | — | — | — |
| 54 | Skalowanie poziome, własność sesji i routing rozproszony | Nie rozpoczęto | — | — | — |
| 55 | Odporność, graceful shutdown i odtwarzanie po awarii | Nie rozpoczęto | — | — | — |
| 56 | Przegląd architektury i refaktoryzacja | Nie rozpoczęto | — | — | — |
| 57 | Pokrycie testami, audyt dostępności i bezpieczeństwa | Nie rozpoczęto | — | — | — |
| 58 | Testy beta z graczami, telemetria i priorytetyzacja błędów | Nie rozpoczęto | — | — | — |
| 59 | Lista gotowości produkcyjnej i uruchomienie | Nie rozpoczęto | — | — | — |
| 60 | Egzamin końcowy, dokumentacja i roadmapa v2 | Nie rozpoczęto | — | — | — |

## Historia ukończonych lekcji

Dla każdej lekcji dopisz: datę, link do PR/commita, zmienione artefakty, wykonane testy, wynik review i wnioski.

### Lekcja 01 — 2026-11-12 — Ukończono

- **Decyzja:** `Lesson 01: CLOSED` — jawne zatwierdzenie właściciela po raporcie `Lesson 01 Completion Gate`.
- **Dowód Git:** [commit zatwierdzonych dokumentów](https://github.com/borys94/tetris-multiplayer/commit/7c421bd0a2d381a788a008717f0ab689754c220c) (`main`).
- **Artefakty:** `specs/001-mvp-architecture/requirements.md` v0.2, `spec.md` v0.3, `design.md` v0.2, `tasks.md` v0.4 — wszystkie `Approved`.
- **Weryfikacja:** przegląd dokumentacji T-01–T-06: `PASS` po korekcie statusów; sprawdzono zakres MVP, wymagania, kryteria, macierze śledzenia, decyzje i zawartość plików w GitHub.
- **Testy:** nie uruchamiano testów aplikacji, CI ani E2E; lekcja dotyczyła dokumentacji.
- **Wnioski:** oddzielać zatwierdzenie merytoryczne od formalnego zamknięcia; dokumentować odroczenia (m.in. FR-10/S-17, reconnect, wejścia); kandydatów ADR-001–ADR-005 sformalizować w lekcji 04.

### Lekcja 02 — 2026-11-13 — Ukończono

- **Decyzja:** `Lesson 02: CLOSED` — jawne zatwierdzenie właściciela po pozytywnym końcowym code review PR #1.
- **Dowód Git:** [PR #1](https://github.com/borys94/tetris-multiplayer/pull/1) z gałęzi `feature/002-ai-workflow`; merge do `main` po stronie właściciela.
- **Artefakty:** `specs/002-ai-workflow/requirements.md` (R-01–R-05), `spec.md` (S-01–S-05, stany pracy z wyjściem z `BLOCKED`), `design.md`, `tasks.md` (T-01–T-06) — wszystkie `Approved`; polityka scope change w `AGENTS.md` (reguła 5); `syllabus.md` ujednolicony z `AGENTS.md` (Express.js, Yarn Workspaces).
- **Weryfikacja:** kontrole spójności ID i macierzy śledzenia: `PASS`; symulacje S-01–S-05: `PASS` (S-01, S-04, S-05 również przećwiczone na żywo; S-02, S-03 dokumentacyjnie); końcowy code review: `PASS`.
- **Testy:** `NOT_RUN` — brak kodu aplikacji; lint markdown i render Mermaid nie były uruchamiane automatycznie.
- **Wnioski:** rozbieżności między dokumentami rozstrzygać przed implementacją (status Draft vs zatwierdzenie, stack w sylabusie); stany procesu muszą mieć zdefiniowane wyjścia; „test diagnostyczny” z tytułu lekcji pozostaje poza specyfikacją 002 (zob. ryzyka).

### Lekcja 03 — 2026-11-13 — Ukończono

- **Decyzja:** `Lesson 03: CLOSED` — zatwierdzenie SDD z decyzjami Q-01–Q-09 i merge PR #2 przez właściciela.
- **Dowód Git:** [PR #2](https://github.com/borys94/tetris-multiplayer/pull/2) z gałęzi `feature/003-monorepo-tooling`; merge `7ff3954` w `main`.
- **Artefakty:** `specs/003-monorepo-tooling/` (R-01–R-05, S-01–S-05, D-01–D-06, DEP-01–DEP-06, T-01–T-05 — `Approved`); Yarn 4.18.1 (`yarnPath`, `node-modules`), Node 26, Turborepo 2.11.11, TypeScript 7.0.2, Vitest 5.1.0; workspace'y `@tetris/game-engine`, `@tetris/server`, `@tetris/web` (szkielety); `yarn.config.cjs`; `README.md`.
- **Weryfikacja:** świeży klon: `yarn install --immutable` = 0, `yarn check` = 0 (9/9 zadań, `^build` przed konsumentami), drugi przebieg `FULL TURBO`, selektywne unieważnianie cache; 6 naruszeń reguł zależności odrzuconych przez `yarn constraints`; API DOM/Node w silniku i głębokie importy odrzucone przez TS. Po merge `yarn check` na `main` = 0.
- **Testy:** testy smoke Vitest w 3 workspace'ach — `PASS`; CI — `NOT_RUN` (L05).
- **Wnioski:** Node ≥ 25 nie dołącza `corepack` — `yarnPath` usuwa ręczny krok; Vitest 5 wymaga `vite` jako peer w każdym workspace z testami; specyfikacja ma być zwięzła (5 wymagań / 5 scenariuszy / 5 zadań wystarczyło).

### Lekcja 04 — 2026-11-13 — Ukończono

- **Decyzja:** `Lesson 04: CLOSED` — zatwierdzenie SDD i ADR-003 oraz merge PR #4 przez właściciela.
- **Dowód Git:** [PR #4](https://github.com/borys94/tetris-multiplayer/pull/4) z gałęzi `feature/004-documentation-sdd`; merge `715f112` w `main`.
- **Artefakty:** `specs/004-documentation-sdd/` (REQ-001–005, SPEC-001–003, AC-001–006, D-001–005, TASK-001–006 — `Approved`); `docs/conventions.md`; szablony `docs/templates/sdd/` (requirements, spec, design, tasks); `docs/adr/ADR-003-server-authoritative-multiplayer.md` (`Accepted`).
- **Decyzje:** schemat ID `REQ/SPEC/TASK/AC` od lekcji 004, `specs/001`–`003` bez migracji (legacy); numery ADR-001–005 zarezerwowane dla kandydatów z 001, nowe od ADR-006; K-01 rozstrzygnięte — Express (formalny ADR-006 do zapisania).
- **Weryfikacja:** linki i kotwice (skrypt, 17 odnośników): `PASS`; wymagane sekcje szablonów i ADR: `PASS`; traceability REQ → SPEC → TASK → AC: `PASS`; zakres tylko dokumentacja: `PASS`.
- **Testy:** `yarn check` 9/9 — `PASS` (bez zmian w kodzie); lint Markdown — `NOT_RUN` (L05).
- **Wnioski:** draft `requirements.md` był kopią `spec.md` — kontrolować kompletność pakietu przed zatwierdzeniem; konflikty konwencji (ID, numeracja ADR, nazwa gałęzi) rozstrzygać przed pisaniem; status `Accepted` tylko po jawnej decyzji właściciela.

### Lekcja 05 — 2026-11-13 — Ukończono

- **Decyzja:** `Lesson 05: CLOSED` — zatwierdzenie SDD z decyzjami D1–D5 i polecenie zamknięcia przez właściciela; squash merge PR #6 przez agenta na polecenie właściciela.
- **Dowód Git:** [PR #6](https://github.com/borys94/tetris-multiplayer/pull/6) z gałęzi `feature/005-ci-quality-gates`; squash merge `afa1b2c` w `main` (pełna historia z commitami testów negatywnych w PR).
- **Artefakty:** `specs/005-ci-quality-gates/` (REQ-001–005, SPEC-001–005, AC-001–006, D-001–006, TASK-001–006 — `Approved`/`DONE`); `.github/workflows/ci.yml`, `.github/actions/setup/`; `eslint.config.mjs`, `.markdownlint-cli2.jsonc`; skrypty `lint`, `lint:ts`, `lint:md`, rozszerzone `check`; README.
- **Decyzje:** `typescript-eslint` nie wspiera TS 7.0 → side-by-side `typescript` = `@typescript/typescript6`, `tsc` z `@typescript/native` (TS 7.0.2); ESLint bez reguł type-aware; markdownlint dla wszystkich `*.md` (MD013, MD060, MD036 wyłączone, MD033 tylko `<nazwa>`), jednorazowa korekta pustych linii; brak cache zależności w CI; ruleset `main-quality-gates` (6 checks, bez bypass) po upublicznieniu repo.
- **Weryfikacja:** AC-001 (opened/synchronize/reopened/zmiana bazy), AC-002 (lint TS i MD), AC-003 (lockfile), AC-005 (uprawnienia) — `PASS` w CI; AC-004 — `PASS` lokalnie (logi Turborepo); AC-006 — `PASS` (`gh pr merge` odrzucony przy nieudanym `lint-markdown`). Czas przebiegu CI 18–49 s.
- **Testy:** `yarn check` 12/12 — `PASS` lokalnie i na `main` po merge; `actionlint` — `NOT_RUN` (blokada uruchomienia pobranej binarki).
- **Wnioski:** weryfikować kompatybilność narzędzi z nową główną wersją kompilatora przed zatwierdzeniem designu; ochrona gałęzi w prywatnym repo wymaga GitHub Pro (repo upublicznione); auto mode wymaga jawnej zgody na operacje zmieniające stan GitHuba (zmiana bazy PR, ruleset, merge).

## Testy wiedzy (co 5 lekcji)

| Lekcje | Data | Wynik | Mocne strony | Luki i działania |
|---|---|---|---|---|
| 01–05 (przegląd po lekcji 5) | — | — | — | — |
| 01–10 (przegląd po lekcji 10) | — | — | — | — |
| 01–15 (przegląd po lekcji 15) | — | — | — | — |
| 01–20 (przegląd po lekcji 20) | — | — | — | — |
| 01–25 (przegląd po lekcji 25) | — | — | — | — |
| 01–30 (przegląd po lekcji 30) | — | — | — | — |
| 01–35 (przegląd po lekcji 35) | — | — | — | — |
| 01–40 (przegląd po lekcji 40) | — | — | — | — |
| 01–45 (przegląd po lekcji 45) | — | — | — | — |
| 01–50 (przegląd po lekcji 50) | — | — | — | — |
| 01–55 (przegląd po lekcji 55) | — | — | — | — |
| 01–60 (przegląd po lekcji 60) | — | — | — | — |

## Rejestr decyzji (ADR)

| ID | Temat | Status | Link |
|---|---|---|---|
| ADR-003 | Server-authoritative multiplayer | Accepted (2026-11-13) | [`docs/adr/ADR-003-server-authoritative-multiplayer.md`](docs/adr/ADR-003-server-authoritative-multiplayer.md) |
| ADR-001, 002, 004, 005 | Kandydaci z `specs/001-mvp-architecture/design.md` §7 | Do formalizacji | — |
| ADR-006 (planowany) | Backend: Express.js (rozstrzygnięcie K-01) | Decyzja właściciela 2026-11-13; ADR do zapisania | — |
| Kandydat (L05) | TypeScript 6/7 side-by-side dla `typescript-eslint` (`specs/005-ci-quality-gates/design.md` D-002) | Decyzja właściciela 2026-11-13; ADR do zapisania | — |

## Ryzyka i blokery

| Data | Ryzyko / bloker | Wpływ | Działanie | Właściciel |
|---|---|---|---|---|
| 2026-11-13 | „Test diagnostyczny” z tytułu lekcji 02 nie jest objęty `specs/002-ai-workflow/` | Niepełna realizacja tematu lekcji 02 | Zrealizować poza repozytorium albo uzasadnić pominięcie przed zamknięciem lekcji | Właściciel |
| 2026-11-13 | Wymagania lekcji 02 zweryfikowane przez review i symulację, bez testów automatycznych (S-03) | Dowody mają charakter manualny | Jawnie odnotowane w PR #1; automatyczne kontrole od lekcji 05 (CI) | Właściciel |
| 2026-11-13 | K-01: `specs/001-mvp-architecture/design.md` wymienia Fastify, a `AGENTS.md` — Express | Sprzeczne źródła prawdy dla backendu | **Rozstrzygnięte 2026-11-13: Express** (004 design Q-003); pozostaje zapis ADR-006 i korekta wzmianek o Fastify w `specs/001` | Właściciel |
| 2026-11-13 | Importy niezadeklarowanych (wyhoistowanych) pakietów nie są wykrywane w monorepo | Ukryta zależność, np. silnika od pakietu aplikacji | Poza zakresem L05 (decyzja 2026-11-13); lint importów do zaplanowania — najpóźniej przed L16/L21 (pierwsze zależności runtime) | Właściciel |
| 2026-11-13 | Side-by-side TS 6/7: edytor i ESLint używają API TS 6, `tsc` — TS 7; wyhoistowany `node_modules/.bin/tsc` w root to TS 6 | Możliwe rozbieżności diagnostyk; ostrzeżenie Yarn YN0066 przy instalacji | Wrócić do jednego `typescript` po wsparciu TS ≥ 7.1 w `typescript-eslint` (issue #10940) | Właściciel |
| 2026-11-13 | Repo publiczne: workflowy z forków nowych kontrybutorów wymagają zatwierdzenia (`first_time_contributors`) | Uruchomienie kodu z forka bez sekretów, z tokenem tylko do odczytu | Rozważyć `all_external_contributors`; nigdy `pull_request_target` | Właściciel |

## Następne kroki

1. Przeprowadzić test wiedzy 01–05 (przegląd po lekcji 5).
2. Rozpocząć lekcję 06 — Model domenowy i stan gry — w osobnym czacie projektu, na podstawie szablonów z `docs/templates/sdd/`; każda zmiana przechodzi 6 wymaganych checks CI.
3. Osobna zmiana dokumentacyjna: ADR-006 (Express), formalizacja ADR-001, 002, 004, 005, kandydatów z L03 (Yarn 4 + `node-modules`, Turborepo + pakiety kompilowane, egzekucja granic zależności) i L05 (TS 6/7 side-by-side) wg `docs/conventions.md`.
4. Odczytać aktualne `AGENTS.md`, `syllabus.md`, `progress.md` oraz specyfikacje w `specs/` przed pracą.
