# Tetris Multiplayer

Gra Tetris w przeglądarce: singleplayer, 1v1 i battle royale do 16 graczy.

- [Roadmapa](docs/roadmap.md)
- [Decyzje architektoniczne (ADR)](docs/adr/README.md)
- [Specyfikacje milestone'ów](docs/specs/)

## Struktura

| Ścieżka              | Pakiet              | Opis                            |
| -------------------- | ------------------- | ------------------------------- |
| `apps/web`           | `@tetris/web`       | Frontend: React + Vite          |
| `apps/server`        | `@tetris/server`    | Backend: Express                |
| `packages/game-core` | `@tetris/game-core` | Silnik gry w czystym TypeScript |

## Jak zacząć

Wymagania: Node w wersji z [`.nvmrc`](.nvmrc) i dowolny Yarn (wersja 4 jest przypięta w repo i uruchamia się automatycznie).

```sh
yarn install                       # instaluje zależności i hook pre-commit
yarn workspace @tetris/web dev     # frontend na http://localhost:5173
yarn workspace @tetris/server dev  # serwer na http://localhost:3000/health
```

## Komendy

| Komenda              | Co robi                                 |
| -------------------- | --------------------------------------- |
| `yarn lint`          | ESLint w całym repo                     |
| `yarn format`        | Formatuje repo Prettierem               |
| `yarn format:check`  | Sprawdza formatowanie                   |
| `yarn typecheck`     | Sprawdza typy we wszystkich pakietach   |
| `yarn test`          | Uruchamia wszystkie testy (Vitest)      |
| `yarn test:coverage` | Testy z raportem pokrycia w `coverage/` |

Hook `pre-commit` uruchamia ESLint `--fix` i Prettier na plikach w commicie. Te same sprawdzenia i testy uruchamia CI dla każdego PR.
