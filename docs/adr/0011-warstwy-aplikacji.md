# ADR-0011: Dziel serwer i web na warstwy z granicami pilnowanymi przez ESLint

- **Status:** Accepted
- **Data:** 2026-11-14
- **Milestone:** M7, M8

## Kontekst

Do M7 `apps/server/src` rósł katalogami według funkcji (`game/`, `rooms/`, `api/`, `auth/`, `db/`), ale bez reguł zależności. Po M7:

- `ws.ts` łączył transport (upgrade, limity, heartbeat) z logiką aplikacji (przejmowanie sesji, przejście do pokoju, rozłączenie w trzech miejscach naraz);
- `game/accounts.ts` importował bazę, cookie i `rooms/`, więc domena zależała od infrastruktury, a między `game/` i `rooms/` był cykl;
- uwierzytelnianie z cookie było zdublowane w API i WS, reguła „wyloguj wszędzie” raz w repozytorium, raz w routerze, bez transakcji;
- `SessionStore` uruchamiał pętlę gry także dla pokoi, a `Room` łączył poczekalnię z symulacją meczu, którą M8 rozszerzy do 16 graczy.

W `apps/web/src` było podobnie:

- `api.ts` łączył klienta HTTP, kopie typów z protokołu, komunikaty i formatowanie dat;
- widok 1v1 importował etykiety i style z `components/Game.tsx`, a routing w `App.tsx` stałą z `versus/`;
- reguły gry (ekrany, reakcje na wiadomości serwera, pauza po rozłączeniu) siedziały w komponentach React, więc testowało się je tylko przez renderowanie całej aplikacji;
- gra solo i mecz miały skopiowaną pętlę przewidywania i obsługę klawiatury, a sześć widoków ten sam kod pobierania danych z API;
- `Predictor` (logika gry) leżał w `net/` obok transportu.

## Rozważane opcje

1. **Zostawić układ i porządkować doraźnie:** zero kosztu teraz, ale M8 (więcej graczy, nowe stany pokoju) dokłada kod do już przeładowanych `ws.ts` i `room.ts`.
2. **Warstwy z regułą importów:** podział według odpowiedzialności i kierunek zależności sprawdzany przez `no-restricted-imports`.
3. **Osobne pakiety workspace na warstwy:** granice wymusza Node, ale to dużo konfiguracji (tsconfig, build, testy) jak na ~3 tys. linii.

## Decyzja

Wybieramy **opcję 2**:

| Katalog          | Odpowiedzialność                                                     | Nie importuje                       |
| ---------------- | -------------------------------------------------------------------- | ----------------------------------- |
| `game/`          | sesja singleplayer, `BufferedGame`, `BufferedClock` (ADR-0006)       | rooms, play, accounts, db, http, ws |
| `rooms/`         | `Room` (poczekalnia, gotowość, wynik), `Match` (rozgrywka, ADR-0010) | play, accounts, db, http, ws        |
| `accounts/`      | hasła, cookie, `authenticator`, operacje admina w transakcjach       | game, rooms, play, http, ws         |
| `db/`            | pula, transakcje, migracje, repozytoria                              | rooms, play, accounts, http, ws     |
| `play/`          | warstwa aplikacji: `Players`, wspólna pętla gry, zapis wyników       | http, ws                            |
| `ws/`            | transport WebSocket: upgrade, limity, heartbeat, protokół → `Player` | http, db                            |
| `http/`          | Express: aplikacja i routery `/api`                                  | ws, play                            |
| `observability/` | logger, metryki, log dostępu                                         | wszystkie powyższe                  |

W `apps/web/src` React jest tylko w `components/`; reszta to czysty TypeScript, testowany bez DOM-u:

| Katalog               | Odpowiedzialność                                                                       | Nie importuje                |
| --------------------- | -------------------------------------------------------------------------------------- | ---------------------------- |
| `api/`                | klient HTTP, typy odpowiedzi, komunikaty błędów                                        | net, play, state, app; React |
| `net/`                | połączenie WebSocket (`Connection`, `connectToServer`), etykiety stanu i błędów        | api, play, state, app; React |
| `play/`               | `Predictor`, klawiatura (DAS/ARR), pętla, rysowanie planszy                            | api, net, state, app; React  |
| `app/`                | trasy z hasha URL                                                                      | api, net, play, state; React |
| `state/`              | stan widoków: `SoloSession`, `MatchSession`, `Lobby`, `AccountStore` (bez Reacta)      | React                        |
| `components/hooks/`   | providery i hooki: `ServerProvider`, `useAccount`, `useStore`, `useApiData`, pętla gry | widoki, ui                   |
| `components/ui/`      | wspólne komponenty i style (plansza, podgląd klocka)                                   | widoki, hooks                |
| `components/<widok>/` | `solo`, `versus`, `account`, `leaderboard`, `admin`: tylko rysowanie i zdarzenia       | inne widoki                  |

Rdzeń nie importuje `react`, `react-dom`, styli ani `components/` i nie zawiera JSX-a. Komponent gry trzyma instancję magazynu ze `state/`, czyta jego stan przez `useSyncExternalStore` i przekazuje mu wiadomości serwera i klawisze.

Serwer składa `main.ts` (sygnały i drenowanie w `lifecycle.ts`, parametry w `config.ts`), a web `App.tsx`. Reguła ESLint (`boundaries` w `eslint.config.js`) obejmuje kod bez testów.

## Konsekwencje

**Pozytywne**

- Domena (`game/`, `rooms/`) jest testowalna bez bazy i WebSocketu, a stan widoków weba (`state/`) bez Reacta i DOM-u; M8 zmienia głównie `Match` na serwerze i `MatchSession` w webie.
- Jedno miejsce dla reguł: uwierzytelnianie, wylogowanie, przejmowanie sesji, pętla gry.
- Złamanie granicy wychodzi w `yarn lint`, a nie dopiero na review.

**Negatywne**

- Domena dalej inkrementuje globalne metryki prom-client: to świadomy kompromis, żeby nie przepuszczać każdego licznika przez callbacki.
- Reguła sprawdza ścieżki importów, nie typy: re-eksport przez dozwolony moduł ją obchodzi.
- Funkcja weba (np. 1v1) ma dwie części: stan w `state/` i widok w `components/versus/`.

## Kiedy wrócić do decyzji

Gdy serwer podzieli się na kilka procesów (np. osobny proces pokoi) albo gdy reguła importów przestanie wystarczać i warto będzie przejść na pakiety workspace.
