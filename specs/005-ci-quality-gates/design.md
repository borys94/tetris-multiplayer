# Design — Lesson 005: CI Quality Gates

**Status:** Draft  
**Specification:** [spec.md](./spec.md)

## 1. Rozwiązanie

GitHub Actions uruchamia workflow dla `pull_request` do `main` (`opened`, `reopened`, `synchronize`, `edited`). Sześć niezależnych jobów o stabilnych nazwach `constraints`, `lint-ts`, `lint-markdown`, `typecheck`, `test`, `build` działa bez zależności `needs` między kontrolami. Każdy job jest osobnym wymaganym status checkiem; nie stosujemy filtrów ścieżek ani warunków pomijających obowiązkowe kontrole. Nie tworzymy agregującego joba `quality-gate`.

Każdy job samodzielnie wykonuje checkout, konfiguruje Node.js 26 według `.nvmrc`, Yarn 4.18.1 według `packageManager`/`yarnPath` i `yarn install --immutable`. Powtarzalne kroki można współdzielić przez prostą lokalną composite action, jeśli faktycznie zmniejszy to duplikację bez utrudniania debugowania. Dopuszczamy cache pobierania pakietów Yarn pomiędzy jobami/uruchomieniami, ale wyłącznie z kluczem opartym na `yarn.lock` i z walidacją instalacji `--immutable`; cache jest optymalizacją, nie źródłem prawdy. W razie problemów z uprawnieniami/cache rezygnujemy z tej optymalizacji, nie z kontroli jakości.

Kontrole `lint-ts`, `typecheck`, `test`, `build` obejmują wszystkie trzy workspace'y (`apps/web`, `apps/server`, `packages/game-engine`); lint Markdown obejmuje uzgodniony zakres dokumentacji. Turborepo respektuje istniejące `^build`; zadania mogą wykonywać się współbieżnie wewnątrz joba zgodnie z grafem. Osobne joby nie współdzielą automatycznie `dist` ani lokalnego cache Turborepo. Zdalny i międzyuruchomieniowy cache Turborepo pozostają poza zakresem.

## 2. Decyzje projektowe

**D-001 — Sześć niezależnych jobów GitHub Actions:** `constraints`, `lint-ts`, `lint-markdown`, `typecheck`, `test`, `build` są stabilnymi nazwami jobów i status checks; brak `needs` między nimi. Wspólna konfiguracja kroków jest dopuszczalna, ale nie wymagana. Zmiana nazwy joba wymaga równoczesnego przeglądu GitHub Rulesets/branch protection. Nie wdrażamy aplikacji.

**D-002 — ESLint i markdownlint-cli2:** osobne reguły dla TypeScript i Markdown. Skrypty w root i workspace'ach zgodne z Yarn/Turborepo; docelowe `yarn lint` obejmuje oba rodzaje lintu, a `yarn check` obejmuje constraints, lint TypeScript i Markdown, typecheck, testy oraz build. Przed wyborem wersji weryfikujemy kompatybilność ESLint i parsera z TypeScript 7. Wersje narzędzi są zapisane w lockfile.

**D-003 — Audyt historycznej dokumentacji:** przed korektami powstaje raport naruszeń; nie zmieniamy zatwierdzonych specyfikacji bez zgody właściciela. Preferujemy wąskie, uzasadnione wyjątki i konfigurację reguł zamiast globalnego wyłączenia lintu. Nie deklarujemy `PASS` przy nieusuniętych naruszeniach w uzgodnionym zakresie.

**D-004 — Graf zależności i cache:** zachowujemy `build.dependsOn = ["^build"]` i odpowiednie zależności `typecheck`/`test`; `lint` nie wymaga build, o ile wybrana konfiguracja nie potrzebuje wygenerowanych typów. Cache lokalny Turborepo może działać wyłącznie w obrębie joba; nie zakładamy współdzielenia wyników między jobami ani przebiegami CI. Negatywny test po zmianie API `game-engine` weryfikuje ponowne wykonanie kontroli zależnych workspace'ów. Cache pobierania Yarn jest odrębny od cache wyników Turborepo.

**D-005 — Bezpieczeństwo i odtwarzalność:** workflow `pull_request` z `permissions: contents: read`, bez `pull_request_target`, sekretów i uprawnień zapisu. Każdy job instaluje zależności przez `yarn install --immutable`; cache nie może zastąpić tego kroku. Przed włączeniem cache Yarn weryfikujemy zachowanie dla PR z forka i minimalne uprawnienia.

**D-006 — Merge gate:** GitHub Rulesets/branch protection wymaga wszystkich sześciu checks: `constraints`, `lint-ts`, `lint-markdown`, `typecheck`, `test`, `build`. CI publikuje wyniki; konfiguracja ochrony `main` jest osobną czynnością wymagającą zgody i uprawnień. Brak możliwości jej sprawdzenia oznacza AC-006 `NOT_RUN`/zadanie `BLOCKED`, nie `PASS`. Weryfikujemy, że niepowodzenie każdego wymaganego checka uniemożliwia merge.

## 3. Alternatywy

- Jeden agregujący `quality-gate`: prostsza lista wymaganych checks, ale dodatkowa logika `failure`/`skipped`/`cancelled` i mniej bezpośrednia diagnostyka; odrzucony na rzecz wariantu A dla SPEC-005.
- Sześć jobów z powielonymi krokami bez wspólnej konfiguracji: prostszy start, większe ryzyko rozjazdu środowisk; dopuszczalne, jeśli composite action byłaby nadmierną abstrakcją.
- Job instalacyjny z `needs` i przekazywaniem artefaktów: możliwe ograniczenie duplikacji, ale wprowadza zależności i dodatkowe punkty awarii; odrzucony.
- Changed-only i zdalny cache Turborepo: potencjalne przyspieszenie kosztem złożoności i ryzyka pominięcia zależności; poza zakresem.

## 4. Ryzyka i ograniczenia

- Sześć instalacji może zwiększyć zużycie minut CI; cache Yarn wymaga pomiaru i sprawdzenia zachowania na PR z forka.
- Zmiana nazwy joba może rozłączyć wymagany status check i zablokować merge.
- Historyczne naruszenia Markdown mogą zwiększyć zakres; wymagają audytu i decyzji właściciela.
- Kompatybilność ESLint z TypeScript 7 wymaga weryfikacji.
- Błędne wejścia zadań Turborepo mogą prowadzić do nieaktualnych wyników cache.
- Brak dostępu do ochrony `main` uniemożliwia potwierdzenie AC-006.
- Cel p95 ≤ 5 minut jest hipotezą; raportujemy czasy zamiast deklarować spełnienie bez pomiarów.

## 5. Otwarte kwestie

- **Q-001 — Rozstrzygnięte:** ESLint + markdownlint-cli2.
- **Q-002 — Rozstrzygnięte:** audyt i zgoda przed zmianami zatwierdzonej dokumentacji.
- **Q-003 — Rozstrzygnięte:** bez zdalnego/współdzielonego cache Turborepo; opcjonalny cache pobierania Yarn po walidacji.
- **Q-004 — Otwarte:** dostępność i konfiguracja wymaganych checks dla `main`.
- **Q-005 — Do sprawdzenia podczas implementacji:** kompatybilność wybranych narzędzi ESLint z TypeScript 7 i praktyczna opłacalność współdzielonej composite action.
