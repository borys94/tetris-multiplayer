# Design — Lesson 005: CI Quality Gates

**Status:** Approved — zatwierdzono przez właściciela 2026-11-13  
**Specification:** [spec.md](./spec.md)

## 1. Rozwiązanie

GitHub Actions uruchamia workflow dla `pull_request` do `main` (`opened`, `reopened`, `synchronize`, `edited`). Sześć niezależnych jobów o stabilnych nazwach `constraints`, `lint-ts`, `lint-markdown`, `typecheck`, `test`, `build` działa bez zależności `needs` między kontrolami. Każdy job jest osobnym wymaganym status checkiem; nie stosujemy filtrów ścieżek ani warunków pomijających obowiązkowe kontrole. Nie tworzymy agregującego joba `quality-gate`.

Każdy job samodzielnie wykonuje checkout, konfiguruje Node.js 26 według `.nvmrc`, Yarn 4.18.1 według `packageManager`/`yarnPath` i `yarn install --immutable`. Powtarzalne kroki (Node, asercja wersji Yarn, instalacja) współdzieli lokalna composite action `.github/actions/setup`; checkout pozostaje w każdym jobie. Pierwsza wersja działa bez cache pobierania Yarn (D-005); ewentualny cache to osobna, późniejsza optymalizacja z kluczem opartym na `yarn.lock`.

Kontrole `lint-ts`, `typecheck`, `test`, `build` obejmują wszystkie trzy workspace'y (`apps/web`, `apps/server`, `packages/game-engine`); lint Markdown obejmuje wszystkie pliki `*.md` w repozytorium (D-003). Turborepo respektuje istniejące `^build`; zadania mogą wykonywać się współbieżnie wewnątrz joba zgodnie z grafem. Osobne joby nie współdzielą automatycznie `dist` ani lokalnego cache Turborepo. Zdalny i międzyuruchomieniowy cache Turborepo pozostają poza zakresem.

## 2. Decyzje projektowe

**D-001 — Sześć niezależnych jobów GitHub Actions:** `constraints`, `lint-ts`, `lint-markdown`, `typecheck`, `test`, `build` są stabilnymi nazwami jobów i status checks; brak `needs` między nimi. Wspólna konfiguracja kroków jest dopuszczalna, ale nie wymagana. Zmiana nazwy joba wymaga równoczesnego przeglądu GitHub Rulesets/branch protection. Nie wdrażamy aplikacji.

**D-002 — ESLint i markdownlint-cli2:** osobne reguły dla TypeScript i Markdown. Skrypty w root i workspace'ach zgodne z Yarn/Turborepo; docelowe `yarn lint` obejmuje oba rodzaje lintu, a `yarn check` obejmuje constraints, lint TypeScript i Markdown, typecheck, testy oraz build. Wersje narzędzi są zapisane w lockfile. ESLint używa wspólnej konfiguracji `eslint.config.js` w root z `typescript-eslint` `recommended` **bez informacji o typach**, więc `lint` nie zależy od `^build`.

Weryfikacja kompatybilności (2026-11-13): `typescript-eslint` 8.72.2 (także `canary`) wymaga `typescript >=4.8.4 <6.1.0` i przerywa działanie przy TS 7.0, który nie udostępnia programistycznego API. Stosujemy oficjalny tryb side-by-side TS 7.0: w każdym `package.json` `"typescript": "npm:@typescript/typescript6@6.0.2"` (API TS 6 dla ESLint i edytora) oraz `"@typescript/native": "npm:typescript@7.0.2"` (binarka `tsc` dla build/typecheck). Build i typecheck nadal wykonuje TS 7.0.2; reguła DEP-05 wymusza jeden zakres w całym repo. Do wycofania po wsparciu TS ≥ 7.1 w `typescript-eslint` (issue typescript-eslint#10940). Kandydat na ADR.

**D-003 — Audyt historycznej dokumentacji:** przed korektami powstaje raport naruszeń; nie zmieniamy treści zatwierdzonych specyfikacji. Wyłączamy z uzasadnieniem MD013 (długość linii — proza i tabele) oraz MD060 (styl kolumn tabel). Właściciel zatwierdził (2026-11-13) jednorazową mechaniczną korektę wyłącznie pustych linii (MD022, MD031, MD032, MD058) we wszystkich plikach, w osobnym commicie, bez zmian treści. Pozostałe naruszenia poprawiamy ręcznie lub wąskim, uzasadnionym wyjątkiem. Nie deklarujemy `PASS` przy nieusuniętych naruszeniach.

**D-004 — Graf zależności i cache:** zachowujemy `build.dependsOn = ["^build"]` i odpowiednie zależności `typecheck`/`test`; `lint` nie wymaga build, o ile wybrana konfiguracja nie potrzebuje wygenerowanych typów. Cache lokalny Turborepo może działać wyłącznie w obrębie joba; nie zakładamy współdzielenia wyników między jobami ani przebiegami CI. Negatywny test po zmianie API `game-engine` weryfikuje ponowne wykonanie kontroli zależnych workspace'ów. Cache pobierania Yarn jest odrębny od cache wyników Turborepo.

**D-005 — Bezpieczeństwo i odtwarzalność:** workflow `pull_request` z `permissions: contents: read`, bez `pull_request_target`, sekretów i uprawnień zapisu. Każdy job instaluje zależności przez `yarn install --immutable` i sprawdza `yarn --version` = 4.18.1 (Node 26 nie zawiera corepack; globalny `yarn` deleguje do `yarnPath`). Zewnętrzne akcje są przypięte do pełnego SHA commita. Pierwsza wersja nie używa cache Yarn — eliminuje ryzyko zatrucia cache i różnic dla PR z forka.

**D-006 — Merge gate:** GitHub Rulesets/branch protection wymaga wszystkich sześciu checks: `constraints`, `lint-ts`, `lint-markdown`, `typecheck`, `test`, `build`. CI publikuje wyniki; konfiguracja ochrony `main` jest osobną czynnością wymagającą zgody i uprawnień. Brak możliwości jej sprawdzenia oznacza AC-006 `NOT_RUN` i TASK-005 `BLOCKED`, nie `PASS`. Weryfikujemy, że niepowodzenie każdego wymaganego checka uniemożliwia merge.

## 3. Alternatywy

- Jeden agregujący `quality-gate`: prostsza lista wymaganych checks, ale dodatkowa logika `failure`/`skipped`/`cancelled` i mniej bezpośrednia diagnostyka; odrzucony na rzecz wariantu A dla SPEC-005.
- Sześć jobów z powielonymi krokami bez wspólnej konfiguracji: prostszy start, większe ryzyko rozjazdu środowisk; dopuszczalne, jeśli composite action byłaby nadmierną abstrakcją.
- Job instalacyjny z `needs` i przekazywaniem artefaktów: możliwe ograniczenie duplikacji, ale wprowadza zależności i dodatkowe punkty awarii; odrzucony.
- Changed-only i zdalny cache Turborepo: potencjalne przyspieszenie kosztem złożoności i ryzyka pominięcia zależności; poza zakresem.
- Oxlint zamiast ESLint (brak zależności od API TS): zmienia rozstrzygnięte Q-001; odrzucony.
- Odłożenie `lint-ts` do wsparcia TS 7.1 w `typescript-eslint`: brak terminu, REQ-001 niespełnione; odrzucony.

## 4. Ryzyka i ograniczenia

- Sześć instalacji może zwiększyć zużycie minut CI; cache Yarn wymaga pomiaru i sprawdzenia zachowania na PR z forka.
- Zmiana nazwy joba może rozłączyć wymagany status check i zablokować merge.
- Historyczne naruszenia Markdown mogą zwiększyć zakres; wymagają audytu i decyzji właściciela.
- Side-by-side TS 6/7: edytor używa API TS 6, a `tsc` — TS 7; możliwe drobne różnice diagnostyk.
- Błędne wejścia zadań Turborepo mogą prowadzić do nieaktualnych wyników cache.
- Brak dostępu do ochrony `main` uniemożliwia potwierdzenie AC-006.
- Cel p95 ≤ 5 minut jest hipotezą; raportujemy czasy zamiast deklarować spełnienie bez pomiarów.

## 5. Otwarte kwestie

- **Q-001 — Rozstrzygnięte:** ESLint + markdownlint-cli2.
- **Q-002 — Rozstrzygnięte:** audyt i zgoda przed zmianami zatwierdzonej dokumentacji.
- **Q-003 — Rozstrzygnięte:** bez zdalnego/współdzielonego cache Turborepo; w pierwszej wersji także bez cache pobierania Yarn.
- **Q-004 — Otwarte:** dostępność i konfiguracja wymaganych checks dla `main`.
- **Q-005 — Rozstrzygnięte (2026-11-13):** side-by-side TS 6/7 (D-002); composite action `.github/actions/setup`.
