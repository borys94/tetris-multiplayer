# Lekcja 03 — Specyfikacja zachowania: monorepo tooling

- **ID:** 003-monorepo-tooling
- **Wersja:** 0.2
- **Status:** Approved — zatwierdzono przez właściciela 2026-11-13

Polecenia uruchamiane są z katalogu głównego. „Czysty klon” = brak `node_modules`, `dist`, `.turbo`.

## 1. Docelowa struktura

```text
apps/
  server/          # @tetris/server — szkielet TS (Node), bez Express
  web/             # @tetris/web    — szkielet TS (DOM lib), bez Vite/React
packages/
  game-engine/     # @tetris/game-engine — czysty TS, zero zależności runtime
.nvmrc  .yarnrc.yml  package.json  yarn.lock
tsconfig.base.json  turbo.json  yarn.config.cjs  README.md
```

```text
@tetris/web ─────┐
                 ├──► @tetris/game-engine
@tetris/server ──┘
```

## 2. Scenariusze akceptacyjne

### S-01 — Instalacja na czystym klonie (R-01)
**Given** czysty klon i Node z `.nvmrc`, **when** wykonano `yarn install --immutable` i `yarn workspaces list --json`, **then** instalacja kończy się kodem 0, `yarn.lock` się nie zmienia, `yarn --version` = 4.x (także przy globalnym Yarn 1.x), a lista zawiera trzy workspace'y `@tetris/*`.

### S-02 — Pełny przebieg i kolejność `^build` (R-03, R-04, R-05)
**Given** czysty klon po instalacji, **when** wykonano `yarn check` (constraints + `turbo run build typecheck test`), **then** wszystkie zadania kończą się kodem 0, `@tetris/game-engine#build` wykonuje się przed zadaniami aplikacji, a w każdym workspace uruchamia się ≥ 1 test.

### S-03 — Cache (R-04)
**Given** stan po S-02:
- **when** polecenie zostanie powtórzone bez zmian, **then** wynik to `FULL TURBO`;
- **when** zmieni się plik w `apps/server/src`, **then** ponownie wykonują się tylko zadania `@tetris/server`;
- **when** zmieni się plik w `packages/game-engine/src` lub `tsconfig.base.json`, **then** ponownie wykonują się zadania silnika i obu aplikacji.

### S-04 — Naruszenia reguł zależności (R-02)
**Given** prawidłowa konfiguracja, **when** wprowadzono tymczasowo którąkolwiek zmianę:
- silnik zależy od `@tetris/web` lub `@tetris/server`,
- `apps/web` zależy od `apps/server`,
- silnik ma wpis w `dependencies`/`peerDependencies` (np. `react`),
- zależność wewnętrzna ma zakres inny niż `workspace:^`,

**then** `yarn constraints` kończy się kodem ≠ 0 z komunikatem wskazującym regułę.

### S-05 — Granice TypeScript (R-03)
**Given** prawidłowa konfiguracja, **when** tymczasowo w `packages/game-engine/src` użyto `document`, `window`, `setTimeout` lub `process` **albo** w `apps/server/src` zaimportowano `@tetris/game-engine/dist/...`, **then** `yarn typecheck` kończy się błędem TS.
**Ograniczenie:** import niezadeklarowanego, ale wyhoistowanego pakietu nie jest wykrywany w L03 — lint importów w L05.

## 3. Macierz

| Wymaganie | Scenariusze |
|---|---|
| R-01 | S-01 + review `README.md` |
| R-02 | S-04 |
| R-03 | S-02, S-05 |
| R-04 | S-02, S-03 |
| R-05 | S-02 |

Zmiany w S-04 i S-05 są tymczasowe i niecommitowane; dowodem jest polecenie, kod wyjścia i fragment komunikatu w raporcie PR.
