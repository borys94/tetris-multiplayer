# ADR-0012: Dziel web na domeny ze wspólnymi `core/`, `hooks/`, `board/` i `ui/`

- **Status:** Accepted
- **Data:** 2026-11-15
- **Milestone:** M8

## Kontekst

ADR-0011 podzielił `apps/web/src` według rodzaju kodu: `api/`, `net/`, `play/`, `state/` i `app/` jako czysty TS, a React tylko w `components/`. Po kilku dniach pracy w tym układzie:

- każda funkcja (1v1, konto, gra solo) leżała w dwóch lub trzech miejscach: stan w `state/`, widok w `components/<widok>/`, provider w `components/hooks/`. ADR-0011 sam wpisał to w minusy;
- `components/hooks/` mieszał hooki wspólne (`useServer`, `useStore`) z hookiem jednej funkcji (`useAccount`) i z pętlą gry potrzebną tylko planszy;
- `components/ui/` mieszał plansze (zależne od `play/render`) z ogólnym arkuszem `views.module.scss`. Widoki składały z jego klas 24 przyciski, 9 tabel i 5 pól formularzy, powtarzając te same `className` i układ tabel;
- M8 rozbudowuje 1v1 do 16 graczy, więc warto, żeby ta zmiana dotyczyła jednego katalogu.

## Rozważane opcje

1. **Zostać przy układzie z ADR-0011:** zero kosztu, ale M8 dalej zmienia `state/`, `components/versus/` i `components/hooks/` naraz.
2. **Domeny ze wspólnymi warstwami:** `domains/<domena>/` (komponenty w korzeniu domeny, stan w `model/`), a kod bez właściciela w `core/`, `hooks/`, `board/` i `ui/`. Granice pilnuje ta sama reguła `no-restricted-imports`.
3. **Pakiet workspace na każdą domenę:** granice wymusza Node, ale to za dużo konfiguracji jak na pięć niewielkich domen.

## Decyzja

Wybieramy **opcję 2**:

| Katalog                       | Odpowiedzialność                                                                                                                                           | Może importować                                   |
| ----------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------- |
| `app/`                        | `App` (menu, przełączanie widoków, providery), `useView`                                                                                                   | wszystko                                          |
| `domains/<domena>/model/`     | stan domeny bez Reacta: `SoloSession`, `Lobby`, `MatchSession`, `AccountStore`                                                                             | `core/`, własny `model/`                          |
| `domains/<domena>/`           | widoki i hooki domeny: tylko rysowanie i zdarzenia                                                                                                         | `core/`, `hooks/`, `board/`, `ui/`, własna domena |
| `domains/account/use-account` | `AccountProvider`, `useAccount`: jedyne publiczne API domeny dla innych domen                                                                              | jak komponenty                                    |
| `board/`                      | plansza i podgląd klocka, pętla gry i klawiatura (`useGameLoop`, `useWindowKeys`)                                                                          | `core/`, `hooks/`, `ui/`                          |
| `hooks/`                      | hooki bez wiedzy o domenach: `ServerProvider`/`useServer`, `useStore`, `useApiData`                                                                        | `core/`                                           |
| `ui/`                         | prymitywy: `Button`, `Tabs`, `Card`, `Page`, `Row`, `Form`, `Field`, `Input`, `Table`, `DataTable`, `ErrorMessage`, `Note`, `Code`; tokeny w `global.scss` | nic poza Reactem                                  |
| `core/`                       | czysty TS: `api/`, `net/`, `play/` (bez zależności między sobą), `store`, `routes`, `format`                                                               | `@tetris/*`                                       |

Domeny: `game` (solo), `versus` (1v1), `account`, `leaderboard`, `admin-panel`. Domena nie importuje innej domeny. Jedyny wyjątek to `account/use-account`, bo menu, ranking i panel admina muszą wiedzieć, kto jest zalogowany. `core/` i `model/` nie importują Reacta ani styli i nie zawierają JSX-a, więc dalej testuje się je bez DOM-u. Widoki nie mają własnych klas dla przycisków, tabel i pól, tylko używają komponentów z `ui/`. Własne style mają tylko komponenty o wyglądzie specyficznym dla domeny (np. `Match/Match.module.scss`) i wspólna plansza (`board.module.scss`).

Granice opisuje `webRestrictions()` w `eslint.config.js`. Każdy plik trafia do jednego wpisu, bo kolejny wpis z `no-restricted-imports` nadpisałby poprzedni. Zakaz importu innych domen używa `regex` zamiast wzorca gitignore, bo gitignore nie pozwala wyjąć pliku (`use-account`) z wykluczonego katalogu.

Część serwerowa ADR-0011 obowiązuje bez zmian.

## Konsekwencje

**Pozytywne**

- Zmiana funkcji (np. M8: 16 graczy) dotyczy głównie `domains/versus/`; nowa domena to nowy katalog i wpis w `WEB_DOMAINS`.
- Wygląd przycisków, tabel i formularzy zmienia się w jednym miejscu; widoki są krótsze (`DataTable` z kolumnami zamiast ręcznego `thead`/`tbody`).
- Stan domeny dalej jest testowalny bez Reacta (`tests/domains/<domena>/model/`).

**Negatywne**

- Ścieżki importów są dłuższe (`../../../ui`).
- `board/` to wspólny kod dwóch domen gry. Gdyby solo i 1v1 zaczęły potrzebować różnych plansz, trzeba będzie go podzielić.
- Kod, który dziś ma jednego właściciela, a jutro dwóch, trzeba przenieść z domeny do `core/` albo `hooks/`, zamiast importować go z innej domeny.

## Kiedy wrócić do decyzji

Gdy więcej domen będzie potrzebowało publicznego API innej domeny (lista `WEB_SHARED` urośnie), albo gdy `core/` urośnie na tyle, że warto go wydzielić do pakietu workspace.
