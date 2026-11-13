# Multiplayer Tetris

Gra multiplayer 1v1 (React + Node.js) budowana w procesie Spec-Driven Development. Plan kursu: [`syllabus.md`](syllabus.md), postępy: [`progress.md`](progress.md), specyfikacje: [`specs/`](specs/), zasady pracy: [`AGENTS.md`](AGENTS.md).

## Wymagania
- **Node.js 26** (zob. `.nvmrc`; np. `nvm use`).
- **Yarn 4** — dostarczony w repozytorium (`.yarn/releases`, `yarnPath`). Wystarczy dowolny globalny `yarn` (także 1.x): w katalogu repo deleguje do wersji z repo. `corepack` nie jest wymagany.

Sprawdzenie: `yarn --version` w katalogu repo powinno zwrócić `4.18.1`.

## Polecenia

| Polecenie | Działanie |
|---|---|
| `yarn install --immutable` | Instalacja zależności bez zmiany `yarn.lock` |
| `yarn build` | Build wszystkich workspace'ów (Turborepo, zależności przed konsumentami) |
| `yarn typecheck` | Sprawdzenie typów |
| `yarn test` | Testy Vitest |
| `yarn constraints` | Reguły zależności (`yarn.config.cjs`); `--fix` naprawia część naruszeń |
| `yarn check` | `constraints` + `build`, `typecheck`, `test` — pełna weryfikacja |
| `yarn clean` | Usunięcie `dist/` i `.turbo/` w workspace'ach |

Pojedynczy workspace: `yarn turbo run test --filter=@tetris/game-engine`.

## Struktura

```text
apps/web               @tetris/web          klient (szkielet; Vite/React od L16)
apps/server            @tetris/server       serwer (szkielet; Express od L21)
packages/game-engine   @tetris/game-engine  deterministyczny silnik gry, bez zależności runtime
```

## Zasady zależności
- Zależności płyną tylko `apps/*` → `packages/*`; aplikacje nie zależą od siebie nawzajem.
- Zależności wewnętrzne: `workspace:^`. Ta sama zależność zewnętrzna ma jedną wersję w całym repo.
- `@tetris/game-engine` nie ma `dependencies` ani `peerDependencies` i kompiluje się bez typów DOM i Node.
- Pakiety udostępniają API wyłącznie przez pole `exports` — bez importów `.../dist/...` czy `.../src/...`.

Szczegóły i uzasadnienie: [`specs/003-monorepo-tooling/design.md`](specs/003-monorepo-tooling/design.md).

## Telemetria
Telemetria Yarn jest wyłączona w `.yarnrc.yml`, a skrypty root wyłączają telemetrię Turborepo (`TURBO_TELEMETRY_DISABLED=1`). Przy wywołaniu `yarn turbo ...` bezpośrednio można ją wyłączyć trwale: `yarn turbo telemetry disable`.
