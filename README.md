# Blockfall

Gra w spadające klocki w przeglądarce: singleplayer, 1v1 i battle royale do 16 graczy. Stan i wynik gry liczy serwer.

> Repo, pakiety (`@tetris/*`), chart i namespace'y zachowują roboczą nazwę `tetris`; gracz widzi wyłącznie nazwę Blockfall.

- [Roadmapa](docs/roadmap.md)
- [Decyzje architektoniczne (ADR)](docs/adr/README.md)
- [Specyfikacje milestone'ów](docs/specs/)

## Struktura

| Ścieżka              | Pakiet              | Opis                             |
| -------------------- | ------------------- | -------------------------------- |
| `apps/web`           | `@tetris/web`       | Frontend: React + Vite           |
| `apps/server`        | `@tetris/server`    | Backend: Express + WebSocket     |
| `packages/game-core` | `@tetris/game-core` | Silnik gry w czystym TypeScript  |
| `packages/protocol`  | `@tetris/protocol`  | Protokół WebSocket klient–serwer |

## Jak zacząć

Wymagania: Node w wersji z [`.nvmrc`](.nvmrc) i dowolny Yarn (wersja 4 jest przypięta w repo i uruchamia się automatycznie).

```sh
yarn install                       # instaluje zależności i hook pre-commit
yarn workspace @tetris/server dev  # serwer gry na http://localhost:3000 (/health, /ws)
yarn workspace @tetris/web dev     # frontend na http://localhost:5173 (proxy /ws do serwera)
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
