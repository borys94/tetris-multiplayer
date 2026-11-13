# Lekcja 03 — Projekt techniczny: monorepo tooling

- **ID:** 003-monorepo-tooling
- **Wersja:** 0.2
- **Status:** Draft — do zatwierdzenia przez właściciela
- **Uwaga:** fragmenty konfiguracji poniżej są **szkicami kontraktu**, nie gotowymi plikami. Dokładne numery wersji narzędzi ustala T-01 na podstawie aktualnych wydań (`npm view <pkg> version`) i przypina w `package.json`/`yarn.lock`; nie są zgadywane w tym dokumencie.

## 1. Ocena wstępnych decyzji

| # | Decyzja wstępna | Ocena | Uzasadnienie / warunki |
|---|---|---|---|
| 1 | Yarn 4 z `nodeLinker: node-modules` | **Akceptuję** | Zgodne z `AGENTS.md` (Yarn Workspaces). `node-modules` zamiast PnP: najmniejsze tarcie z Vite, Vitest, Playwright, IDE i Dockerem. Koszt: możliwe „phantom dependencies” (RK-02). Warunek: aktywacja Yarn 4 bez `corepack` w Node 26 (D-02, RK-01). |
| 2 | Workspaces `apps/*`, `packages/*` | **Akceptuję** | Zgodne z `001/design.md` §3. Wzorce glob pozwalają dodać `packages/contracts` (L26) bez zmiany roota. |
| 3 | Turborepo | **Akceptuję** | Zgodne z `AGENTS.md`. Daje graf zadań i cache treści; `yarn workspaces foreach -t` daje kolejność, ale nie cache. |
| 4 | Granice `apps/web`, `apps/server`, `packages/game-engine` | **Akceptuję z doprecyzowaniem** | W L03 aplikacje są **szkieletami TS** (bez Vite/React/Express) — wystarczą do dowodu grafu, kolejności i granic, nie wyprzedzając L16/L21 (Q-03). `packages/contracts` z `001/design.md` §3 — odroczony do L26 (Q-04). |
| 5 | `game-engine` jako niezależny, deterministyczny pakiet TS | **Akceptuję w części narzędziowej** | L03 egzekwuje niezależność (brak deps runtime, brak typów DOM/Node, `exports`). Determinizm (RNG, czas) to kwestia kodu domeny — L06+. Efekt uboczny: brak `@types/node` i lib DOM blokuje API hosta (`setTimeout`, `performance`, `process`), ale `Date` i `Math.random` pozostają dostępne w lib ES — ryzyko RK-06. |
| 6 | Zależności apps → engine, nigdy odwrotnie | **Akceptuję** | Egzekwowane manifestowo przez Yarn constraints (D-06). Poziom importów: L05. |
| 7 | `^build` przed konsumentami | **Akceptuję** | Wynika z wyboru pakietów kompilowanych (D-04). `typecheck` i `test` konsumentów też zależą od `^build`, bo rozwiązują typy i kod z `dist/`. |

## 2. Decyzje techniczne

### D-01 — Node.js: przypięta wersja LTS
- **Wybór:** `.nvmrc` z główną wersją `26` oraz `"engines": { "node": ">=26" }` w root `package.json` (Q-01: alternatywnie 24).
- **Dlaczego:** lokalne środowisko to Node 26.11.1; linia 26 jest Active LTS od października 2026.
- **Koszt:** obraz Docker/CI musi używać tej samej linii (L05, L42).

### D-02 — Aktywacja Yarn 4
- **Wybór (rekomendacja):** pole `"packageManager": "yarn@4.<x>.<y>"` jako źródło prawdy **oraz** `yarnPath` wskazujący na śledzony `.yarn/releases/yarn-4.<x>.<y>.cjs` (generowany przez `yarn set version`).
- **Dlaczego:** Node ≥ 25 nie dołącza `corepack`; u właściciela `corepack` jest niedostępny. `yarnPath` sprawia, że globalny Yarn 1.22 deleguje wywołania do wersji z repo — bez dodatkowych kroków u developera i w CI.
- **Alternatywa:** samo `packageManager` + `npm i -g corepack && corepack enable` — mniejsze repo (brak ~3 MB pliku `.cjs`), ale dodatkowy krok ręczny i zależność od pakietu `corepack` z npm.
- **Warunek weryfikacji (T-01):** empirycznie potwierdzić, że `yarn --version` w repo zwraca 4.x przy globalnym Yarn 1.22.22. Jeżeli nie — STOP i decyzja właściciela (Q-02).

### D-03 — `.yarnrc.yml`
```yaml
nodeLinker: node-modules
yarnPath: .yarn/releases/yarn-4.x.y.cjs   # zależnie od D-02
enableTelemetry: false                    # Q-07
```
Bez `nmHoistingLimits` (domyślny hoisting): ograniczenie hoistingu nie usuwa phantom deps z `node_modules` roota, a zwiększa instalację. Ochrona przed phantom deps: D-06 + lint w L05.

### D-04 — Pakiety wewnętrzne kompilowane (`tsc` → `dist/`)
- **Wybór:** `@tetris/game-engine` kompilowany przez `tsc` do `dist/` (ESM + `.d.ts` + `declarationMap`); konsumenci rozwiązują `exports` → `dist/`.
- **Alternatywa A — „just-in-time” (eksport `./src/index.ts`):** brak kroku build, szybsza pętla dev; ale `server` uruchamiany w Node wymagałby loadera TS w runtime, a granica publicznego API jest słabsza.
- **Alternatywa B — TS project references (`tsc -b`):** przyrostowy build TS, ale dubluje graf, który zna już Turborepo, i komplikuje konfigurację.
- **Konsekwencja:** potrzebny `^build`; nawigacja IDE do źródeł przez `declarationMap`; tryb watch (`dev`) dodamy w L16.

### D-05 — Nazewnictwo i manifesty workspace'ów
- Scope `@tetris/` (Q-05); każdy workspace: `"private": true`, `"type": "module"`, `"version": "0.0.0"`.
- Skrypty w każdym workspace mają te same nazwy: `build`, `typecheck`, `test`, `clean`.

Szkic `packages/game-engine/package.json`:
```json
{
  "name": "@tetris/game-engine",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "exports": {
    ".": { "types": "./dist/index.d.ts", "default": "./dist/index.js" }
  },
  "files": ["dist"],
  "scripts": {
    "build": "tsc -p tsconfig.build.json",
    "typecheck": "tsc -p tsconfig.json --noEmit",
    "test": "vitest run",
    "clean": "rm -rf dist .turbo"
  },
  "devDependencies": { "typescript": "<pinned>", "vitest": "<pinned>" }
}
```
Aplikacje deklarują `"@tetris/game-engine": "workspace:^"` w `dependencies`.

Placeholder API silnika (bez gameplayu), wyłącznie do dowodu konsumpcji:
```ts
// packages/game-engine/src/index.ts
export const ENGINE_API_VERSION = 0 as const;
```

## 3. Struktura plików (nowe pliki)

```text
.nvmrc
.yarnrc.yml
.yarn/releases/yarn-4.x.y.cjs        # zależnie od D-02
package.json                         # root: workspaces, packageManager, engines, skrypty turbo
yarn.lock
yarn.config.cjs                      # constraints (D-06)
tsconfig.base.json
turbo.json
README.md                            # wymagania i polecenia (§8)
packages/game-engine/{package.json,tsconfig.json,tsconfig.build.json,src/index.ts,src/index.test.ts}
apps/server/{package.json,tsconfig.json,tsconfig.build.json,src/index.ts,src/index.test.ts}
apps/web/{package.json,tsconfig.json,tsconfig.build.json,src/index.ts,src/index.test.ts}
```
Zmieniany: `.gitignore` (dopisanie wpisów, bez usuwania `.DS_Store`).

## 4. TypeScript

### 4.1 `tsconfig.base.json` (wspólne, bez ustawień środowiska)
```jsonc
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022"],
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true,      // Q-06
    "noImplicitOverride": true,
    "noFallthroughCasesInSwitch": true,
    "verbatimModuleSyntax": true,
    "isolatedModules": true,
    "forceConsistentCasingInFileNames": true,
    "skipLibCheck": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "types": []
  }
}
```
`"types": []` w bazie wyłącza automatyczne dołączanie `@types/*` z wyhoistowanego `node_modules` — każdy workspace włącza typy jawnie.

### 4.2 Konfiguracje per workspace

| Workspace | `module` / `moduleResolution` | `lib` | `types` | Uzasadnienie |
|---|---|---|---|---|
| `game-engine` | `NodeNext` / `NodeNext` | `ES2022` | `[]` | Emitowany kod musi działać w Node (server) i w bundlerze (web); brak DOM i Node = egzekucja S-05. |
| `server` | `NodeNext` / `NodeNext` | `ES2022` | `["node"]` | Uruchamiany bezpośrednio w Node; `@types/node` jako devDependency `server`. |
| `web` | `ESNext` / `Bundler` | `ES2022`, `DOM`, `DOM.Iterable` | `[]` | Przygotowanie pod Vite (L16); w L03 build = `tsc`. |

- `tsconfig.json` (typecheck) obejmuje `src/**/*` łącznie z testami; `tsconfig.build.json` rozszerza go, ustawia `rootDir: src`, `outDir: dist` i wyklucza `**/*.test.ts`.
- `NodeNext` wymaga rozszerzeń `.js` w importach względnych — świadomy koszt (RK-05).
- Testy Vitest pobierają typy przez jawny `import { describe, it, expect } from 'vitest'` (bez `globals`), więc `types: []` nie przeszkadza.

## 5. Zasady deklarowania zależności (egzekwowane w `yarn.config.cjs`)

| ID | Reguła | Egzekucja |
|---|---|---|
| DEP-01 | Zależność od innego workspace'u ma zakres `workspace:^`. | constraint (`--fix` naprawia) |
| DEP-02 | Workspace z `packages/*` nie zależy od żadnego workspace'u z `apps/*`. | constraint (błąd) |
| DEP-03 | Workspace z `apps/*` nie zależy od innego workspace'u z `apps/*`. | constraint (błąd) |
| DEP-04 | `@tetris/game-engine` nie ma `dependencies` ani `peerDependencies` (dozwolone `devDependencies`). | constraint (błąd) |
| DEP-05 | Ta sama zależność zewnętrzna ma identyczny zakres we wszystkich workspace'ach. | constraint (`--fix` naprawia) |
| DEP-06 | Każdy workspace ma `private: true` i `type: "module"`. | constraint (`--fix` naprawia) |
| DEP-07 | Narzędzie wywoływane w skryptach workspace'u (`tsc`, `vitest`) jest zadeklarowane w jego `devDependencies`; root deklaruje tylko narzędzia orkiestracji (`turbo`, `@yarnpkg/types`). | review + DEP-05 dla spójności wersji |
| DEP-08 | Pakiet importowany w kodzie jest zadeklarowany w manifeście tego workspace'u (brak phantom deps). | **L05** (lint importów); w L03 — review |

Szkic `yarn.config.cjs` (Yarn 4 JS constraints, typy z `@yarnpkg/types`):
```js
// @ts-check
/** @type {import('@yarnpkg/types')} */
const { defineConfig } = require('@yarnpkg/types');

const isApp = (ws) => ws.cwd.startsWith('apps/');
const isPkg = (ws) => ws.cwd.startsWith('packages/');

module.exports = defineConfig({
  async constraints({ Yarn }) {
    for (const ws of Yarn.workspaces()) {
      if (ws.cwd === '.') continue;
      ws.set('private', true);                                   // DEP-06
      ws.set('type', 'module');
    }
    for (const dep of Yarn.dependencies()) {
      const target = Yarn.workspace({ ident: dep.ident });
      if (target) {
        dep.update('workspace:^');                               // DEP-01
        if (isPkg(dep.workspace) && isApp(target))
          dep.error(`DEP-02: ${dep.workspace.ident} (packages) must not depend on ${dep.ident} (apps)`);
        if (isApp(dep.workspace) && isApp(target))
          dep.error(`DEP-03: apps must not depend on other apps (${dep.ident})`);
      }
      if (dep.workspace.ident === '@tetris/game-engine' && dep.type !== 'devDependencies')
        dep.error(`DEP-04: game-engine must not have runtime/peer dependencies (${dep.ident})`);
      for (const other of Yarn.dependencies({ ident: dep.ident }))  // DEP-05
        if (other.type !== 'peerDependencies' && dep.type !== 'peerDependencies')
          dep.update(other.range);
    }
  },
});
```
Dokładne API (`Yarn.workspaces`, `dep.type`, `dep.error`) T-04 weryfikuje względem zainstalowanej wersji `@yarnpkg/types`.

## 6. Turborepo — graf zadań i cache

### 6.1 `turbo.json` (szkic, Turborepo 2.x — klucz `tasks`)
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

### 6.2 Graf dla trzech workspace'ów
```text
@tetris/game-engine#build ──┬──► @tetris/server#build | #typecheck | #test
                            └──► @tetris/web#build    | #typecheck | #test
@tetris/game-engine#typecheck, #test  (bez zależności wewnętrznych)
```

### 6.3 Zasady cache
- **Wejścia zadania:** domyślne Turborepo — pliki workspace'u śledzone przez Git (bez ignorowanych `dist/`, `.turbo/`), manifest, hash zależności z `yarn.lock` i hashe zadań `^build`.
- **Wejścia globalne:** `tsconfig.base.json`, `.nvmrc`; zmiana `yarn.lock` / root `package.json` jest uwzględniana przez Turborepo automatycznie.
- **Wyjścia:** tylko `build` produkuje cache'owane artefakty (`dist/**`); `typecheck` i `test` cache'ują wyłącznie log i status.
- **Środowisko:** brak zmiennych `env` w L03; tryb `strict` (domyślny w 2.x) — nowe zmienne środowiskowe wpływające na wynik trzeba jawnie dopisać do `env` (od L16/L21).
- **Nie cache'ujemy:** `clean`; w przyszłości `dev` (`cache: false`, `persistent: true`).
- **Zdalny cache:** poza zakresem (L41). Lokalny cache w `.turbo/` (ignorowany przez Git).
- Pliki `tsconfig.build.json` należą do workspace'u, więc ich zmiana unieważnia tylko ten workspace (i konsumentów przez `^build`).

## 7. Testy
- Vitest w każdym workspace (`vitest run`, środowisko `node`, bez pliku konfiguracji, dopóki nie jest potrzebny).
- `game-engine`: test wartości `ENGINE_API_VERSION`.
- `server`, `web`: test importujący `@tetris/game-engine` przez nazwę pakietu — dowód rozwiązywania `exports` i kolejności `^build`.
- Brak testów E2E i serwerowych w L03.

## 8. Polecenia (kontrakt dla README i przyszłego CI)

| Polecenie (root) | Działanie |
|---|---|
| `yarn install --immutable` | instalacja bez modyfikacji lockfile |
| `yarn build` | `turbo run build` |
| `yarn typecheck` | `turbo run typecheck` |
| `yarn test` | `turbo run test` |
| `yarn clean` | `turbo run clean` + usunięcie `node_modules/.cache/turbo` (jeśli istnieje) |
| `yarn constraints` | reguły DEP-01–DEP-06 |
| `yarn check` | `yarn constraints && turbo run build typecheck test` — zbiorcza weryfikacja L03 |

Nazwa `check` nie koliduje z wbudowanymi poleceniami Yarn 4 (w Yarn 1 `yarn check` było poleceniem wbudowanym — kolejny powód, by globalny Yarn 1 nie obsługiwał repo).

## 9. `.gitignore` — dopisywane wpisy
```gitignore
node_modules/
dist/
.turbo/
*.tsbuildinfo
coverage/
.yarn/*
!.yarn/releases
!.yarn/patches
!.yarn/plugins
!.yarn/sdks
!.yarn/versions
```

## 10. Kandydaci na ADR (formalizacja w L04)
- **ADR-006** — Yarn 4 + `node-modules` linker + aktywacja przez `yarnPath`/`packageManager`.
- **ADR-007** — Turborepo jako orkiestrator; pakiety wewnętrzne kompilowane (`^build`) zamiast JIT / project references.
- **ADR-008** — Egzekucja granic zależności: Yarn constraints (manifest) + lib/types TS (L03) + lint importów (L05).

## 11. Ryzyka, konflikty i kompromisy

### Konflikty z istniejącą dokumentacją
- **K-01:** `specs/001-mvp-architecture/design.md` v0.2 (`Approved`) w §2, §3 i regułach zależności wymienia **Fastify**, a `AGENTS.md`, `syllabus.md` i `specs/002-ai-workflow/design.md` — **Express.js**. Lekcja 03 nie dotyka serwera HTTP, więc konflikt nie blokuje implementacji. Nie zmieniam zatwierdzonego dokumentu 001 bez decyzji (Q-08).
- **K-02:** `001/design.md` §3 przewiduje `packages/contracts`; proponowane granice L03 go nie obejmują. Propozycja: odroczyć do L26, regułami DEP-02/DEP-03 już objęty (Q-04).

### Ryzyka
| ID | Ryzyko | Skutek | Redukcja |
|---|---|---|---|
| RK-01 | Brak `corepack` w Node 26; globalny Yarn 1 może obsłużyć repo zamiast Yarn 4 | Niezgodny lockfile, błędne polecenia (`yarn check`) | D-02 (`yarnPath`), weryfikacja w T-01, instrukcja w README |
| RK-02 | Phantom dependencies przez hoisting `node-modules` | Silnik może zaimportować wyhoistowany pakiet mimo DEP-04 | `types: []`, brak lib DOM; DEP-08 lint w L05; review |
| RK-03 | Nieaktualne `dist/` lub nawigacja IDE do `.d.ts` | Mylące błędy typów w IDE | `declarationMap`; `^build`; tryb watch w L16 |
| RK-04 | Fałszywe trafienia cache (niezadeklarowane wejścia) | Zielony wynik dla nieaktualnego kodu | `globalDependencies`, tryb `strict` env, S-03 jako test cache |
| RK-05 | `NodeNext` wymaga `.js` w importach względnych | Tarcie dla developerów | Świadomy koszt; błąd jest wykrywany przez `typecheck` |
| RK-06 | Determinizm nie jest egzekwowany przez L03 (`Date`, `Math.random` dostępne w lib ES) | Fałszywe poczucie bezpieczeństwa | Jawnie poza zakresem; reguły lint/architektury w L05–L06 |
| RK-07 | `rm -rf` w `clean` nie działa na Windows | Brak przenośności | Akceptowalne (macOS/Linux, CI Linux); ewentualnie `node -e` lub `rimraf` |
| RK-08 | Szkielety aplikacji bez Vite/Express mogą wymagać przebudowy skryptów w L16/L21 | Dodatkowa praca później | Kontrakt nazw zadań (`build/typecheck/test`) pozostaje stabilny; zmienia się tylko implementacja skryptu |

## 12. Pytania otwarte (decyzje właściciela)
- **Q-01:** Node 26 (rekomendacja; lokalnie 26.11.1) czy 24?
- **Q-02:** Aktywacja Yarn 4: `yarnPath` + commit binarki (rekomendacja) czy `corepack` z npm?
- **Q-03:** Aplikacje w L03 jako szkielety TS (rekomendacja) czy od razu minimalny Vite (web) / Express (server)?
- **Q-04:** `packages/contracts` — odroczyć do L26 (rekomendacja) czy utworzyć pusty szkielet teraz?
- **Q-05:** Scope pakietów `@tetris/` — akceptacja?
- **Q-06:** `exactOptionalPropertyTypes: true` w bazie (rekomendacja: tak, ścisłość przydatna dla kontraktów) — akceptacja?
- **Q-07:** Wyłączyć telemetrię Yarn (`enableTelemetry: false`) w repo i udokumentować `turbo telemetry disable` w README?
- **Q-08:** K-01 (Fastify vs Express) — erratum w `specs/001-mvp-architecture/design.md` w osobnym commicie tej gałęzi, czy rozstrzygnięcie w ADR w L04?
- **Q-09:** Czy dodać `README.md` w L03 (rekomendacja: tak, minimalny), czy dokumentację developerską przenieść do L04?
