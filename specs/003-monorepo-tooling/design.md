# Lekcja 03 — Projekt techniczny: monorepo tooling

- **ID:** 003-monorepo-tooling
- **Wersja:** 0.3
- **Status:** Approved — zatwierdzono przez właściciela 2026-11-13
- **Uwaga:** konfiguracje poniżej to szkice; wersje narzędzi ustala i przypina T-01 na podstawie aktualnych wydań.

## 1. Decyzje

| ID | Decyzja | Alternatywa odrzucona | Koszt / warunek |
|---|---|---|---|
| D-01 | Node 26 LTS: `.nvmrc` + `engines.node >=26`. | Node 24 | CI i Docker muszą używać tej samej linii. |
| D-02 | Yarn 4: `packageManager` + `yarnPath` (śledzony `.yarn/releases/*.cjs`), bo Node ≥ 25 nie dołącza `corepack`. | `corepack` instalowany z npm | ~3 MB w repo. T-01 sprawdza, że globalny Yarn 1.22 deleguje do 4.x; jeśli nie — `BLOCKED`. |
| D-03 | `nodeLinker: node-modules`. | PnP | Zgodność z Vite/Vitest/IDE/Dockerem kosztem ryzyka phantom deps (RK-02). |
| D-04 | Pakiety wewnętrzne kompilowane `tsc` → `dist/` (ESM + `.d.ts` + `declarationMap`), API przez `exports`. Stąd `^build`. | Eksport `src/*.ts` (JIT); TS project references | Krok build przed konsumentami; tryb watch dopiero w L16. |
| D-05 | Turborepo 2.x jako orkiestrator z lokalnym cache. | `yarn workspaces foreach -t` | Dodatkowe narzędzie; w zamian graf i cache. |
| D-06 | Aplikacje w L03 to szkielety TS (bez Vite/React/Express); `packages/contracts` odroczony do L26. | Pełny Vite/Express teraz | Skrypty `build` aplikacji zmienią się w L16/L21; nazwy zadań pozostają. |

Wszystkie workspace'y: scope `@tetris/`, `private: true`, `type: "module"`, skrypty `build`, `typecheck`, `test`, `clean`. Placeholder silnika: `export const ENGINE_API_VERSION = 0 as const;`.

## 2. TypeScript

`tsconfig.base.json`: `target`/`lib` `ES2022`, `strict`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes` (Q-06), `verbatimModuleSyntax`, `isolatedModules`, `declaration`, `declarationMap`, `skipLibCheck`, `types: []` (bez automatycznych `@types/*` z wyhoistowanego `node_modules`).

| Workspace | `module` / `moduleResolution` | `lib` | `types` |
|---|---|---|---|
| `game-engine` | `NodeNext` | `ES2022` | `[]` — brak DOM i Node (S-05) |
| `server` | `NodeNext` | `ES2022` | `["node"]` |
| `web` | `ESNext` / `Bundler` | `ES2022`, `DOM` | `[]` |

`tsconfig.json` (typecheck) obejmuje testy; `tsconfig.build.json` emituje `src` → `dist` bez `*.test.ts`. Vitest bez `globals` (jawne importy).

## 3. Zasady zależności (`yarn.config.cjs`, Yarn constraints)

| ID | Reguła |
|---|---|
| DEP-01 | Zależność od workspace'u ma zakres `workspace:^`. |
| DEP-02 | `packages/*` nie zależy od `apps/*`. |
| DEP-03 | `apps/*` nie zależy od innych `apps/*`. |
| DEP-04 | `@tetris/game-engine` nie ma `dependencies` ani `peerDependencies`. |
| DEP-05 | Ta sama zależność zewnętrzna ma jeden zakres w całym repo. |
| DEP-06 | Każdy workspace ma `private: true` i `type: "module"`. |

Narzędzia używane w skryptach workspace'u (`tsc`, `vitest` i jego wymagany peer `vite`) są w jego `devDependencies`; root ma tylko `turbo` i `@yarnpkg/types`. Brak niezadeklarowanych importów w kodzie egzekwuje lint w L05. Wersje przypięte w T-01/T-02: Yarn 4.18.1, Turborepo 2.11.11, TypeScript 7.0.2, Vitest 5.1.0, Vite 8.3.8, `@types/node` 26.6.6.

## 4. Turborepo

```json
{
  "$schema": "https://turborepo.com/schema.json",
  "globalDependencies": ["tsconfig.base.json", ".nvmrc"],
  "tasks": {
    "build":     { "dependsOn": ["^build"], "outputs": ["dist/**"] },
    "typecheck": { "dependsOn": ["^build"], "outputs": [] },
    "test":      { "dependsOn": ["^build"], "outputs": [] },
    "clean":     { "cache": false }
  }
}
```

- `typecheck` i `test` aplikacji zależą od `^build`, bo rozwiązują silnik z `dist/`.
- Wejścia: pliki workspace'u śledzone przez Git, `yarn.lock` i pliki globalne; tylko `build` ma cache'owane artefakty.
- Brak `env` w L03 (tryb `strict`); zdalny cache — L41.

## 5. Polecenia root

`yarn build` / `typecheck` / `test` / `clean` → `turbo run <task>`; `yarn constraints`; `yarn check` = constraints + `turbo run build typecheck test`.
`.gitignore` dostaje: `node_modules/`, `dist/`, `.turbo/`, `*.tsbuildinfo`, `.yarn/*` z wyjątkiem `releases`, `patches`, `plugins`, `sdks`, `versions`.

## 6. Konflikty i ryzyka

- **K-01:** `specs/001-mvp-architecture/design.md` wymienia Fastify, a `AGENTS.md` — Express. Nie blokuje L03 (Q-08).
- **K-02:** `001/design.md` przewiduje `packages/contracts` — odroczony do L26 (D-06).
- **RK-01:** globalny Yarn 1 zamiast Yarn 4 → D-02 i weryfikacja w T-01.
- **RK-02:** phantom deps przy `node-modules` → `types: []`, DEP-04; lint importów w L05.
- **RK-03:** fałszywe trafienia cache → `globalDependencies`, test S-03.
- **RK-04:** L03 nie egzekwuje determinizmu (`Date`, `Math.random` dostępne) → L06+.

Kandydaci na ADR (L04): Yarn 4 + `node-modules`; Turborepo + pakiety kompilowane; egzekucja granic zależności.

## 7. Decyzje właściciela (2026-11-13)

- **Q-01:** Node 26.
- **Q-02:** `yarnPath` + `packageManager`.
- **Q-03:** szkielety TS aplikacji.
- **Q-04:** `packages/contracts` w L26.
- **Q-05:** scope `@tetris/`.
- **Q-06:** `exactOptionalPropertyTypes: true`.
- **Q-07:** telemetria wyłączona (`enableTelemetry: false`; `TURBO_TELEMETRY_DISABLED=1` w skryptach root).
- **Q-08:** K-01 rozstrzygnąć w ADR w L04; `specs/001` bez zmian.
- **Q-09:** minimalny `README.md` w L03.
