# Blockfall (tetris-multiplayer)

Monorepo Yarn 4: `apps/web` (React + Vite), `apps/server` (Express + ws), `packages/game-core`, `packages/protocol`. Wymagania i decyzje są w `docs/specs/<funkcja>.md`, a architektura w `docs/adr/`.

## Sprawdzanie zmian

`yarn lint`, `yarn format:check`, `yarn typecheck`, `yarn test`

## Konwencje

- Granice katalogów pilnuje ESLint: serwer według ADR-0011, web według ADR-0012 (`domains/`, `core/`, `hooks/`, `board/`, `ui/`).
- Funkcje tylko jako funkcje strzałkowe (`const f = () => {}`), a `function` tylko w metodach klas i obiektów. `if`, `else` i pętle zawsze z klamrami. Pilnuje ESLint (`func-style`, `curly`).
- Bez średników, stringi w apostrofach (`'…'`). Formatuje Prettier (`.prettierrc.json`), sprawdza `yarn format:check`.
- Testy leżą w `apps/<app>/tests`, w tym samym układzie co `src/`.
- **Komponenty React:** komponent ze stylami to folder `Nazwa/` z `Nazwa.tsx` i `Nazwa.module.scss`, bez `index.ts`. Komponent bez styli to sam plik `Nazwa.tsx`. Komponent importuje tylko własny arkusz; jedyny wspólny to `board/board.module.scss` (pilnuje `apps/web/tests/conventions.test.ts`).
- Przyciski, tabele, pola i karty bierzemy z `apps/web/src/ui`, a nie piszemy jako surowe `<button>` z klasami.
- Przy przenoszeniu kodu od razu poprawiamy ścieżki w specach i ADR-ach.
