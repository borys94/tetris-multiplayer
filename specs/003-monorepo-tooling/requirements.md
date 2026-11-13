# Lekcja 03 — Wymagania: monorepo, TypeScript, Yarn i Turborepo

- **ID:** 003-monorepo-tooling
- **Wersja:** 0.2
- **Status:** Draft — do zatwierdzenia przez właściciela
- **Zakres:** narzędzia monorepo i szkielety workspace'ów, bez funkcjonalności gry, UI ani API.
- **Powiązania:** `AGENTS.md` (stack), `specs/001-mvp-architecture/` (NFR-02, S-19, §3), `specs/002-ai-workflow/` (proces SDD).

## Cel
Powtarzalny fundament repozytorium: jeden menedżer pakietów, jawny graf workspace'ów, wspólny TypeScript, orkiestracja zadań z cache i automatycznie egzekwowane granice zależności.

## Stan wyjściowy (2026-11-13)
Repo zawiera tylko dokumentację (brak `package.json`, `tsconfig`, `apps/`, `packages/`). Lokalnie: Node `v26.11.1`, globalny Yarn `1.22.22`, brak `corepack`.

## Wymagania

| ID | Wymaganie | Kryterium akceptacji |
|---|---|---|
| R-01 | Yarn 4 (`nodeLinker: node-modules`) z workspace'ami `apps/*` i `packages/*`; istnieją `@tetris/game-engine`, `@tetris/web`, `@tetris/server`. | Na czystym klonie `yarn --version` = 4.x, `yarn install --immutable` = 0, `yarn workspaces list` zwraca trzy workspace'y; wersja Node przypięta; `README.md` opisuje polecenia. |
| R-02 | Zależności płyną tylko `apps/*` → `packages/*`; zależności wewnętrzne mają zakres `workspace:^`; `game-engine` nie ma zależności runtime. | `yarn constraints` = 0, a każde naruszenie kończy się błędem. |
| R-03 | Wspólna ścisła konfiguracja TypeScript; `game-engine` kompiluje się bez typów DOM i Node, a jego API jest dostępne tylko przez `exports`. | `yarn typecheck` = 0; użycie API DOM/Node w silniku lub głęboki import z aplikacji dają błąd TS. |
| R-04 | Turborepo uruchamia `build`, `typecheck`, `test` z zależnością `^build` i poprawnym cache. | Na czystym klonie zadania przechodzą bez ręcznego builda; powtórny przebieg bez zmian = `FULL TURBO`; zmiana w workspace unieważnia tylko jego i konsumentów. |
| R-05 | Każdy workspace ma test smoke (Vitest, Node, bez przeglądarki i serwera). | `yarn test` uruchamia test w każdym workspace; testy aplikacji importują silnik przez nazwę pakietu. |

## Poza zakresem
Logika gry (L06+), Vite/React (L16), Express/`ws` (L21/L26), `packages/contracts` (L26), ESLint i CI (L05), zdalny cache (L41), Docker, formalne ADR (L04), zmiany w `specs/001-mvp-architecture/`.

## Kryterium zakończenia
R-01–R-05 mają dowód `PASS` z uruchomionych poleceń, PR przeszedł review, właściciel zatwierdził zamknięcie; dopiero wtedy aktualizowany jest `progress.md`.
