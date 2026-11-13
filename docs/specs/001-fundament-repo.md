# Spec 001 · Fundament repo

- **Milestone:** M1 · **Status:** Approved (2026-11-13)

## Cel

Monorepo gotowe do pisania gry: trzy pakiety, wspólny TypeScript, lint, testy i CI pilnujące jakości każdej zmiany.

## Wymagania

| #   | Wymaganie                                                                                                               |
| --- | ----------------------------------------------------------------------------------------------------------------------- |
| R1  | Yarn 4 workspaces z pakietami `apps/web`, `apps/server`, `packages/game-core`.                                          |
| R2  | Wspólny TypeScript w trybie strict; `yarn typecheck` sprawdza wszystkie pakiety.                                        |
| R3  | ESLint i Prettier; `yarn lint` i `yarn format:check` sprawdzają całe repo; hook `pre-commit` poprawia pliki w commicie. |
| R4  | Vitest we wszystkich pakietach; `yarn test` uruchamia wszystko, `yarn test:coverage` raportuje pokrycie.                |
| R5  | CI (GitHub Actions) dla każdego PR i pushu na `main`; czerwone CI blokuje merge.                                        |

## Scenariusze akceptacyjne

| #   | Given                                                  | When                          | Then                                                               |
| --- | ------------------------------------------------------ | ----------------------------- | ------------------------------------------------------------------ |
| S1  | Świeży klon, Node z `.nvmrc`                           | `yarn install && yarn test`   | Instalacja bez zmian w `yarn.lock`, testy przechodzą               |
| S2  | `web` i `server` importują `@tetris/game-core`         | `yarn typecheck && yarn test` | Import działa bez budowania `game-core`                            |
| S3  | Błąd typów, lintu lub formatowania w dowolnym pakiecie | Odpowiednia komenda           | Kod wyjścia ≠ 0 i wskazany plik                                    |
| S4  | PR do `main`                                           | CI się kończy                 | Install, lint, format, typecheck i test widoczne jako osobne kroki |
| S5  | PR z nieprzechodzącym testem                           | CI się kończy                 | Status czerwony, merge zablokowany przez ruleset                   |

## Design

```
.github/workflows/ci.yml   .yarnrc.yml (node-modules, yarnPath)   .nvmrc (26)
package.json               tsconfig.base.json   eslint.config.js   vitest.config.ts
apps/web          @tetris/web        Vite + React (placeholder)
apps/server       @tetris/server     Express (placeholder)
packages/game-core @tetris/game-core czysty TS
```

| Obszar            | Decyzja                                                                                                                                                                            |
| ----------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Menedżer pakietów | Yarn 4 przypięty w repo (`yarnPath`), `nodeLinker: node-modules` dla zgodności z Vite i ESLintem; Yarn 1 jest tylko utrzymywany, a Node 26 nie ma Corepacka                        |
| Pakiety           | `@tetris/*`, `private: true`, zależności przez `workspace:*`                                                                                                                       |
| `game-core`       | Internal package: `exports` → `src/index.ts`, bez builda (do rewizji przy Dockerze w M3)                                                                                           |
| TS                | TypeScript 6.0 (typescript-eslint nie obsługuje jeszcze 7.x), `strict`, `noUncheckedIndexedAccess`, `moduleResolution: "bundler"`, `noEmit`; w pakietach `typecheck: tsc --noEmit` |
| Lint              | ESLint 10 flat config + `typescript-eslint` (type-checked) + `eslint-config-prettier`                                                                                              |
| Hook              | husky `pre-commit` → lint-staged: `prettier --write` i `eslint --fix` na plikach w commicie; CI pozostaje bramką                                                                   |
| Testy             | Root `vitest.config.ts` z `test.projects`; `web` w `jsdom`, reszta w `node`; pokrycie `v8`, progi od M2                                                                            |
| Skrypty w roocie  | `lint`, `format`, `format:check`, `typecheck` (`workspaces foreach -A`), `test`, `test:coverage`                                                                                   |
| CI                | Job `quality`: checkout → setup-node (`.nvmrc`, cache yarn) → `install --immutable` → lint → format:check → typecheck → test:coverage                                              |
| Ochrona `main`    | Ruleset `main-quality-gates`: wymagany status `quality`, zmiany tylko przez PR, zakaz force-push i usunięcia                                                                       |

Poza zakresem: logika gry (M2), Docker i deploy (M3), Turborepo, hooki `commit-msg` i `pre-push`.

## Zadania

| #   | Zadanie                                                                   | Pokrywa    | Status |
| --- | ------------------------------------------------------------------------- | ---------- | ------ |
| T1  | Yarn 4, `.nvmrc`, root `package.json`, szkielety pakietów                 | R1, S1     | ☑      |
| T2  | Konfiguracja TS; `game-core` importowany przez `web` i `server`           | R2, S2, S3 | ☑      |
| T3  | ESLint i Prettier, sformatowanie repo, `pre-commit` (husky + lint-staged) | R3, S3     | ☑      |
| T4  | Vitest z projektami, test w każdym pakiecie, pokrycie                     | R4, S1, S2 | ☑      |
| T5  | Workflow CI, ruleset, „Jak zacząć” w `README.md`                          | R5, S4, S5 | ☑      |
