# Lekcja 03 — Specyfikacja zachowania: monorepo tooling

- **ID:** 003-monorepo-tooling
- **Wersja:** 0.1
- **Status:** Draft — do zatwierdzenia przez właściciela

## 1. Aktorzy i kontekst
- **Developer** — klonuje repo i uruchamia polecenia z katalogu głównego.
- **Agent (Claude Code)** — implementuje zadania i dostarcza dowody uruchomień.
- **CI (od L05)** — wykona te same polecenia co developer; L03 nie tworzy pipeline'u, ale polecenia muszą być nieinteraktywne i deterministyczne.

Wszystkie polecenia uruchamiane są z katalogu głównego repo. „Czysty klon” oznacza: brak `node_modules`, `dist`, `.turbo` i lokalnego cache Turborepo (`git clean -xdf` lub świeży `git clone`).

## 2. Docelowa struktura (po L03)

```text
.
├── apps/
│   ├── server/          # @tetris/server — szkielet TS (Node), bez Express
│   └── web/             # @tetris/web    — szkielet TS (DOM lib), bez Vite/React
├── packages/
│   └── game-engine/     # @tetris/game-engine — czysty TS, zero zależności runtime
├── specs/ docs/ ...     # bez zmian
├── .nvmrc  .yarnrc.yml  package.json  yarn.lock
├── tsconfig.base.json  turbo.json  yarn.config.cjs
└── README.md
```

Graf zależności workspace'ów (dozwolone krawędzie):

```text
@tetris/web ─────┐
                 ├──► @tetris/game-engine   (brak zależności runtime)
@tetris/server ──┘
(przyszłość, L26: web/server ──► @tetris/contracts; contracts nie zależy od apps)
```

## 3. Scenariusze akceptacyjne

### S-01 — Instalacja na czystym klonie (R-01, R-10)
**Given** czysty klon i Node w wersji z `.nvmrc`, **when** developer wykonuje `yarn install --immutable`, **then** instalacja kończy się kodem 0, `yarn.lock` pozostaje niezmieniony, a `yarn --version` zwraca wersję z pola `packageManager`.
**Przypadek brzegowy:** globalnie zainstalowany Yarn 1.x nie może wykonać instalacji samodzielnie — polecenie `yarn` w repo musi zostać przekierowane do Yarn 4 (mechanizm: `design.md` D-02). Jeżeli przekierowanie nie działa, `README.md` podaje jednoznaczną instrukcję naprawczą.

### S-02 — Lista workspace'ów (R-02)
**Given** zainstalowane zależności, **when** wykonano `yarn workspaces list --json`, **then** wynik zawiera dokładnie: `.`, `apps/server`, `apps/web`, `packages/game-engine` z nazwami `@tetris/*`.

### S-03 — Kolejność zadań `^build` (R-07)
**Given** czysty klon po instalacji, **when** wykonano `yarn turbo run typecheck test`, **then** `@tetris/game-engine#build` wykonuje się przed `typecheck` i `test` aplikacji, a wszystkie zadania kończą się kodem 0 bez ręcznego wcześniejszego `build`.
**Dowód grafu:** `yarn turbo run test --dry=json` — w zadaniu `@tetris/server#test` pole `dependencies` zawiera `@tetris/game-engine#build`.

### S-04 — Testy smoke bez przeglądarki i serwera (R-09, 001/S-19)
**Given** zainstalowane zależności, **when** wykonano `yarn test`, **then** Vitest uruchamia w środowisku `node` co najmniej jeden test w każdym z trzech workspace'ów; testy `web` i `server` importują `@tetris/game-engine` przez nazwę pakietu; żaden test nie otwiera portu ani przeglądarki.

### S-05 — Odrzucenie odwróconej zależności (R-04)
**Given** prawidłowa konfiguracja, **when** do `packages/game-engine/package.json` zostanie dodana zależność od `@tetris/web` lub `@tetris/server`, **then** `yarn constraints` kończy się kodem ≠ 0 z komunikatem wskazującym regułę kierunku zależności. Analogicznie dla zależności `apps/web` → `apps/server`.

### S-06 — Zakaz zależności runtime silnika (R-04, NFR-02 z L01)
**Given** prawidłowa konfiguracja, **when** do `dependencies` lub `peerDependencies` silnika zostanie dodany dowolny pakiet (np. `react`), **then** `yarn constraints` kończy się kodem ≠ 0. `devDependencies` narzędziowe (`typescript`, `vitest`) są dozwolone.

### S-07 — Brak typów DOM/Node w silniku (R-05)
**Given** prawidłowa konfiguracja, **when** w `packages/game-engine/src` pojawi się odwołanie do `document`, `window`, `setTimeout` lub `process` (żadne z nich nie należy do lib `ES2022`), **then** `yarn turbo run typecheck --filter=@tetris/game-engine` kończy się błędem `TS2304`/`TS2580` (nieznana nazwa).
**Ograniczenie (jawne):** jawny `import` niezadeklarowanego pakietu, który akurat jest wyhoistowany do `node_modules`, nie jest wykrywany w L03 — kontrola importów na poziomie kodu należy do L05 (zob. ryzyko RK-02).

### S-08 — Publiczne API przez `exports` (R-06)
**Given** prawidłowa konfiguracja, **when** `apps/server/src` importuje `@tetris/game-engine/dist/index.js` lub `@tetris/game-engine/src/index`, **then** `typecheck` kończy się błędem rozwiązywania modułu (ścieżka niewyeksportowana).

### S-09 — Cache: trafienie przy braku zmian (R-08)
**Given** udany przebieg `yarn turbo run build typecheck test`, **when** polecenie zostanie powtórzone bez zmian w plikach, **then** wszystkie zadania raportują `cache hit` (podsumowanie `FULL TURBO`), a artefakty `dist/` są odtworzone z cache.

### S-10 — Cache: selektywne unieważnienie (R-08)
**Given** stan po S-09:
- **when** zmieni się plik w `apps/server/src`, **then** ponownie wykonują się tylko zadania `@tetris/server#*`; pozostałe to `cache hit`;
- **when** zmieni się plik w `packages/game-engine/src`, **then** ponownie wykonują się zadania silnika oraz `typecheck`/`test` obu aplikacji (i ich `build`);
- **when** zmieni się `tsconfig.base.json`, **then** cache jest unieważniony dla wszystkich zadań;
- **when** zmieni się wyłącznie plik w `specs/`, **then** wszystkie zadania to `cache hit`.

### S-11 — Spójność wersji i protokół `workspace:` (R-03)
**Given** prawidłowa konfiguracja, **when** workspace deklaruje `@tetris/game-engine` z zakresem innym niż `workspace:^` **lub** dwa workspace'y deklarują różne zakresy `typescript`, **then** `yarn constraints` zgłasza błąd, a `yarn constraints --fix` przywraca zgodny stan.

### S-12 — Czyszczenie i odtwarzalność (R-07, R-10)
**Given** zbudowane repo, **when** wykonano `yarn clean`, **then** katalogi `dist/` i `.turbo/` workspace'ów zostają usunięte, a `git status` nie pokazuje plików nieśledzonych pochodzących z buildu przed ani po `clean` (artefakty są ignorowane).

## 4. Macierz wymagania → scenariusze

| Wymaganie | Scenariusze |
|---|---|
| R-01 | S-01 |
| R-02 | S-02 |
| R-03 | S-11 |
| R-04 | S-05, S-06 |
| R-05 | S-07 |
| R-06 | S-08 |
| R-07 | S-03, S-12 |
| R-08 | S-09, S-10 |
| R-09 | S-04 |
| R-10 | S-01, S-12 + review `README.md` |

Scenariusze negatywne (S-05–S-08, S-11) wykonuje się jako tymczasowe modyfikacje, które **nie są commitowane**; dowodem jest zapis polecenia, kod wyjścia i fragment komunikatu w raporcie PR.
