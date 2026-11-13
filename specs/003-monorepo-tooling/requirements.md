# Lekcja 03 — Wymagania: monorepo, TypeScript, Yarn i Turborepo

- **ID:** 003-monorepo-tooling
- **Wersja:** 0.1
- **Status:** Draft — do zatwierdzenia przez właściciela
- **Zakres:** konfiguracja narzędzi monorepo i szkielety workspace'ów bez funkcjonalności gry, UI ani API.
- **Powiązania:** `AGENTS.md` (uzgodniony stack), `specs/001-mvp-architecture/` (NFR-02, S-19, §3 „Proponowane granice kodu”), `specs/002-ai-workflow/` (proces SDD, raport `PASS`/`FAIL`/`NOT_RUN`).

## Cel
Zbudować powtarzalny fundament repozytorium: jeden menedżer pakietów, jawny graf workspace'ów, wspólną konfigurację TypeScript, orkiestrację zadań z cache oraz automatycznie egzekwowane granice zależności — tak, aby lekcje 05–15 (CI, silnik) i 16–21 (web, server) mogły dodawać kod bez zmian w strukturze monorepo.

## Stan wyjściowy (zweryfikowany 2026-11-13)
- Repozytorium zawiera wyłącznie dokumentację: `AGENTS.md`, `syllabus.md`, `progress.md`, `specs/001–002`, `.gitignore` (tylko `.DS_Store`), pusty katalog `docs/adr/` (nieśledzony).
- Brak `package.json`, `yarn.lock`, `tsconfig*.json`, `turbo.json`, `apps/`, `packages/`, `CLAUDE.md`, `README.md`.
- Środowisko lokalne właściciela: Node `v26.11.1`, globalny Yarn `1.22.22`, **brak** polecenia `corepack`.

## Wymagania

| ID | Wymaganie | Kryterium akceptacji |
|---|---|---|
| R-01 | Repozytorium używa Yarn 4 jako jedynego menedżera pakietów, w trybie `nodeLinker: node-modules`. | Wersja Yarn jest przypięta w repozytorium (`packageManager`); `yarn --version` w katalogu repo zwraca `4.x`; `yarn.lock` jest śledzony; `yarn install --immutable` na czystym klonie kończy się kodem 0; brak `package-lock.json` / `pnpm-lock.yaml`. |
| R-02 | Workspace'y są zdefiniowane wzorcami `apps/*` i `packages/*`; w lekcji 03 istnieją dokładnie trzy: `@tetris/game-engine`, `@tetris/web`, `@tetris/server`. | `yarn workspaces list` zwraca root i te trzy workspace'y; każdy ma `"private": true` i `"type": "module"`. |
| R-03 | Każdy workspace jawnie deklaruje zależności, których używa; zależności wewnętrzne używają protokołu `workspace:^`; ta sama zależność zewnętrzna ma jedną wersję w całym repo. | `yarn constraints` kończy się kodem 0; reguły z `design.md` §5 są zapisane w `yarn.config.cjs`. |
| R-04 | Kierunek zależności: `apps/*` → `packages/*`, nigdy odwrotnie; aplikacje nie zależą od siebie nawzajem; `@tetris/game-engine` nie ma zależności runtime. | `yarn constraints` zgłasza błąd dla każdego naruszenia (scenariusze S-05, S-06); graf `turbo` nie zawiera cykli. |
| R-05 | Wspólna, ścisła konfiguracja TypeScript (`tsconfig.base.json`) z konfiguracjami per workspace; `game-engine` kompiluje się bez typów DOM i Node. | `yarn typecheck` przechodzi; użycie `document`, `window` lub `process` w `packages/game-engine/src` powoduje błąd kompilacji (S-07). |
| R-06 | Publiczne API pakietu jest zdefiniowane wyłącznie przez pole `exports`; konsumenci nie importują wnętrza pakietu. | Import `@tetris/game-engine` działa w `web` i `server`; import ścieżki głębokiej (np. `@tetris/game-engine/dist/...` lub `/src/...`) kończy się błędem TypeScript (S-08). |
| R-07 | Turborepo orkiestruje zadania `build`, `typecheck`, `test`, `clean`; zadania zależą od `^build`, więc zależności workspace'ów budują się przed konsumentami. | Na czystym klonie, bez ręcznego budowania, `yarn turbo run test typecheck` przechodzi; `--dry=json` pokazuje `@tetris/game-engine#build` jako zależność zadań aplikacji (S-03). |
| R-08 | Cache Turborepo jest poprawny: trafia przy braku zmian i unieważnia się przy zmianie wejść, łącznie z konfiguracją globalną. | Drugi przebieg bez zmian: wszystkie zadania `cache hit`; zmiana w `apps/server/src` unieważnia tylko zadania `server`; zmiana w `packages/game-engine/src` lub `tsconfig.base.json` unieważnia odpowiednio silnik + konsumentów lub wszystko (S-09, S-10). |
| R-09 | Każdy workspace ma uruchamiany przez Vitest test smoke działający w Node, bez przeglądarki i bez serwera HTTP/WebSocket. | `yarn test` uruchamia ≥ 1 test w każdym workspace; testy aplikacji importują silnik przez nazwę pakietu (S-04). |
| R-10 | Środowisko jest odtwarzalne i udokumentowane. | Wersja Node przypięta (`.nvmrc`, `engines.node`); `.gitignore` obejmuje artefakty (`node_modules`, `dist`, `.turbo`, `.yarn/*` z wyjątkami); `README.md` opisuje wymagania i polecenia z `design.md` §8. |

## Wymagania niefunkcjonalne
- **NFR-L03-01 (minimalizm):** brak narzędzi i plików niewymaganych przez R-01–R-10; szkielety aplikacji nie zawierają logiki biznesowej.
- **NFR-L03-02 (zgodność z L01):** konfiguracja realizuje część manifestową i typową kontroli S-19 / NFR-02 ze `specs/001-mvp-architecture/`; kontrola importów na poziomie kodu (lint) pozostaje w L05.
- **NFR-L03-03 (prywatność):** telemetria Yarn i Turborepo jest wyłączona w konfiguracji repo lub udokumentowana (zob. pytanie otwarte Q-07).

## Poza zakresem
- Logika gry, model domenowy, deterministyczne RNG/czas (L06–L15).
- React, Vite, Canvas i zadanie `dev` dla web (L16–L17); Express, `ws` i zadanie `dev` dla server (L21, L26).
- Pakiet `packages/contracts` i Zod (L26) — slot jest zarezerwowany w regułach zależności, ale pakiet nie powstaje.
- ESLint/Prettier i zadanie `lint` (L05), GitHub Actions (L05), zdalny cache Turborepo (L41), Docker (L25/L42).
- Formalne pliki ADR (L04) — decyzje L03 są kandydatami ADR-006–ADR-008 (`design.md` §10).
- Zmiana zatwierdzonych dokumentów `specs/001-mvp-architecture/` (zob. konflikt K-01 w `design.md` §11).

## Kryterium zakończenia lekcji
R-01–R-10 mają dowód `PASS` z faktycznie uruchomionych poleceń (scenariusze S-01–S-12 w `spec.md`), PR przeszedł code review, właściciel zatwierdził zamknięcie, a dopiero potem aktualizowany jest `progress.md`.
