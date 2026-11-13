# Lekcja 03 — Plan zadań

- **ID:** 003-monorepo-tooling
- **Wersja:** 0.2
- **Status:** Draft — do zatwierdzenia przez właściciela
- **Gałąź:** `feature/003-monorepo-tooling`

**Przed T-01:** zatwierdzenie SDD i decyzje Q-01–Q-09 (`design.md` §7). **Po T-05:** code review PR, zgoda właściciela, aktualizacja `progress.md`.

Każde zadanie = osobny commit + dowód z uruchomionych poleceń. Status: `TODO` → `IN_PROGRESS` → `DONE` / `BLOCKED`.

| ID | Zadanie | Wymagania | Dowód ukończenia | Status |
|---|---|---|---|---|
| T-01 | Bootstrap: `.nvmrc`, `.yarnrc.yml`, aktywacja Yarn 4 (D-02), root `package.json`, `.gitignore`; przypięcie wersji narzędzi. | R-01 | `yarn --version` = 4.x przy globalnym Yarn 1.22; `yarn install --immutable` = 0. Brak Yarn 4 → `BLOCKED`. | TODO |
| T-02 | `tsconfig.base.json` i trzy workspace'y (`game-engine`, `server`, `web`) z placeholderem API silnika i testami smoke. | R-01, R-03, R-05 | `yarn workspaces foreach -At run test` = 0; `packages/game-engine/dist/index.d.ts` istnieje. | TODO |
| T-03 | `turbo.json` i skrypty root (`build`, `typecheck`, `test`, `clean`, `check`). | R-04 | S-02, S-03. | TODO |
| T-04 | `yarn.config.cjs` z regułami DEP-01–DEP-06. | R-02 | `yarn constraints` = 0; S-04. | TODO |
| T-05 | `README.md`, weryfikacja na czystym klonie, scenariusze negatywne (S-05), raport `PASS`/`FAIL`/`NOT_RUN` dla S-01–S-05, PR do `main`. | wszystkie | Raport w opisie PR; brak merge bez zgody. | TODO |

## Polecenia weryfikacyjne (T-05)
```bash
git clean -xdn                     # podgląd; właściwe -xdf po potwierdzeniu
yarn install --immutable           # S-01
yarn workspaces list --json        # S-01
yarn check                         # S-02
yarn check                         # S-03: FULL TURBO
# S-03: modyfikacja apps/server/src, potem packages/game-engine/src → obserwacja cache
# S-04, S-05: zmiany tymczasowe → yarn constraints / yarn typecheck → git restore
```

## Prompt dla Claude Code — po zatwierdzeniu SDD

> Pracujesz w `borys94/tetris-multiplayer` na gałęzi `feature/003-monorepo-tooling`. Przeczytaj `AGENTS.md`, `progress.md` i `specs/003-monorepo-tooling/*` (status `Approved`). Wykonaj T-01–T-05, każde jako osobny commit. Bez logiki gry, Vite/React, Express, ESLint i CI. Jeżeli Yarn 4 nie aktywuje się albo zmiana wykracza poza zakres — zatrzymaj się z propozycją. Raportuj S-01–S-05 jako `PASS`/`FAIL`/`NOT_RUN`. Bez merge i bez aktualizacji `progress.md` bez zgody właściciela.
