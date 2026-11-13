# Lekcja 03 — Plan zadań

- **ID:** 003-monorepo-tooling
- **Wersja:** 0.1
- **Status:** Draft — do zatwierdzenia przez właściciela
- **Gałąź:** `feature/003-monorepo-tooling`

Każde zadanie kończy się osobnym commitem i dowodem z faktycznie uruchomionych poleceń (kod wyjścia + istotny fragment wyjścia). Status: `TODO` → `IN_PROGRESS` → `DONE` / `BLOCKED`.

| ID | Zadanie | Wymagania | Dowód ukończenia | Status |
|---|---|---|---|---|
| T-01 | Zatwierdzić SDD i rozstrzygnąć Q-01–Q-09 (`design.md` §12). | wszystkie | Decyzje naniesione w SDD; status `Approved`. | TODO |
| T-02 | Bootstrap narzędzi: `.nvmrc`, `.yarnrc.yml`, aktywacja Yarn 4 wg D-02, root `package.json` (`workspaces`, `packageManager`, `engines`), `.gitignore`. Ustalić i przypiąć aktualne wersje `turbo`, `typescript`, `vitest`, `@types/node`, `@yarnpkg/types`. | R-01, R-10 | `yarn --version` = 4.x w repo przy globalnym Yarn 1.22; `yarn install` tworzy `yarn.lock`; `yarn install --immutable` = 0. Jeśli Yarn 4 nie aktywuje się → `BLOCKED` + raport. | TODO |
| T-03 | `tsconfig.base.json` + workspace `packages/game-engine` (manifest, `tsconfig*.json`, placeholder `ENGINE_API_VERSION`, test smoke). | R-02, R-05, R-06, R-09 | `yarn workspace @tetris/game-engine run build` / `typecheck` / `test` = 0; `dist/index.js` i `dist/index.d.ts` istnieją. | TODO |
| T-04 | Szkielety `apps/server` i `apps/web` zależne od silnika przez `workspace:^`, z testami importującymi `@tetris/game-engine`. | R-02, R-04, R-05, R-09 | `yarn workspaces list --json` (S-02); testy aplikacji przechodzą po zbudowaniu silnika. | TODO |
| T-05 | `turbo.json` i skrypty root (`build`, `typecheck`, `test`, `clean`, `check`). | R-07, R-08 | S-03 (czysty klon, `--dry=json`), S-09, S-10, S-12 — wyniki w raporcie. | TODO |
| T-06 | `yarn.config.cjs` z regułami DEP-01–DEP-06. | R-03, R-04 | `yarn constraints` = 0; S-05, S-06, S-11 dają oczekiwany błąd (zmiany tymczasowe, niecommitowane). | TODO |
| T-07 | Kontrole granic TS: S-07 (DOM/Node w silniku) i S-08 (głęboki import). | R-05, R-06 | Kody błędów TS w raporcie; zmiany tymczasowe wycofane (`git status` czysty). | TODO |
| T-08 | `README.md`: wymagania (Node, Yarn), instalacja, polecenia z `design.md` §8, struktura workspace'ów, zasady zależności (skrót DEP-xx). | R-10 | Review treści; polecenia z README wykonane i zgodne z wynikami. | TODO |
| T-09 | Pełna weryfikacja na czystym klonie (`git clean -xdf` → `yarn install --immutable` → `yarn check`), raport `PASS`/`FAIL`/`NOT_RUN` dla S-01–S-12, PR do `main`. | wszystkie | Raport w opisie PR; brak merge bez zgody właściciela. | TODO |
| T-10 | Po code review i zgodzie właściciela: aktualizacja `progress.md` (status, dowody, ADR-006–008 jako kandydaci, ryzyka). | R-10 | Diff `progress.md` oparty na faktycznych wynikach. | TODO |

## Kolejność i zależności zadań
```text
T-01 → T-02 → T-03 → T-04 → T-05 → T-06 → T-07 → T-08 → T-09 → (review) → T-10
```
T-06 i T-07 mogą zostać wykonane w dowolnej kolejności po T-05. T-08 może powstawać równolegle, ale jest finalizowany po T-07, aby opisywał faktyczne zachowanie.

## Macierz wymagania → zadania → scenariusze

| Wymaganie | Zadania | Scenariusze |
|---|---|---|
| R-01 | T-02, T-09 | S-01 |
| R-02 | T-03, T-04 | S-02 |
| R-03 | T-06 | S-11 |
| R-04 | T-04, T-06 | S-05, S-06 |
| R-05 | T-03, T-07 | S-07 |
| R-06 | T-03, T-07 | S-08 |
| R-07 | T-05 | S-03, S-12 |
| R-08 | T-05 | S-09, S-10 |
| R-09 | T-03, T-04 | S-04 |
| R-10 | T-02, T-08, T-10 | S-01, S-12 |

## Polecenia weryfikacyjne (T-09)
```bash
git clean -xdf -e .DS_Store                 # czysty stan (potwierdzić z właścicielem przed uruchomieniem)
yarn --version                              # oczekiwane 4.x
yarn install --immutable                    # S-01
yarn workspaces list --json                 # S-02
yarn turbo run test --dry=json              # S-03 (graf)
yarn check                                  # constraints + build/typecheck/test
yarn turbo run build typecheck test         # S-09: oczekiwane FULL TURBO
# S-10: kolejno modyfikacja apps/server/src, packages/game-engine/src, tsconfig.base.json, specs/ → obserwacja cache hit/miss
yarn clean && git status --porcelain        # S-12
```
Uwaga: `git clean -xdf` usuwa pliki nieśledzone — przed uruchomieniem sprawdzić `git clean -xdn` (dry-run).

## Checklist review
- [ ] Brak logiki gry, React/Vite, Express/`ws`, ESLint, CI, Dockera (zakres L03).
- [ ] `game-engine` nie ma `dependencies`/`peerDependencies`; nie ma lib DOM ani `@types/node`.
- [ ] Wszystkie zależności wewnętrzne używają `workspace:^`.
- [ ] Wersje narzędzi przypięte i spójne między workspace'ami.
- [ ] `turbo.json` deklaruje `outputs` dla `build`; `clean` bez cache.
- [ ] Scenariusze negatywne wykonane i wycofane; raport rozróżnia `PASS`/`FAIL`/`NOT_RUN`.
- [ ] Konflikty K-01/K-02 rozstrzygnięte lub jawnie odroczone.
- [ ] `progress.md` niezmieniony przed zgodą właściciela.

## Prompt dla Claude Code — po zatwierdzeniu SDD

> Pracujesz w repozytorium `borys94/tetris-multiplayer` na gałęzi `feature/003-monorepo-tooling`. Przeczytaj aktualne `AGENTS.md`, `progress.md` i `specs/003-monorepo-tooling/{requirements,spec,design,tasks}.md` (status `Approved`). Wykonaj kolejno T-02–T-09, każde zadanie jako osobny commit. Nie dodawaj logiki gry, Vite/React, Express, ESLint ani CI. Wersje narzędzi ustal na podstawie aktualnych wydań i przypnij. Jeżeli Yarn 4 nie aktywuje się zgodnie z D-02 lub zmiana wykracza poza zakres — zatrzymaj się i przedstaw propozycję. Raportuj wyniki S-01–S-12 jako `PASS`/`FAIL`/`NOT_RUN` z poleceniem i fragmentem wyjścia. Nie wykonuj merge, nie aktualizuj `progress.md` bez zgody właściciela.
