# Ranking i historia

- **Status:** Aktualny (2026-11-15) · **Historia:** M5, M7 · **ADR-y:** [0006](../adr/0006-serwer-zrodlem-prawdy.md), [0008](../adr/0008-postgres-w-klastrze.md)

## Cel

Gry solo i mecze 1v1 liczone przez serwer trafiają do bazy. Każdy widzi publiczny ranking, a zalogowany gracz także historię swoich gier i meczów.

## Wymagania

| #   | Wymaganie                                                                                                               |
| --- | ----------------------------------------------------------------------------------------------------------------------- |
| R1  | Gra solo zalogowanego gracza zapisuje się po game over z wynikiem policzonym przez serwer; gra gościa nie zapisuje się. |
| R2  | Każdy mecz 1v1 (gracze, zwycięzca, powód, wysłane linie, czas trwania) zapisuje się, także z gośćmi pod ich nazwą.      |
| R3  | Publiczny ranking solo: najlepszy wynik każdego gracza, top 50.                                                         |
| R4  | Zalogowany gracz widzi historię swoich ostatnich 50 gier solo i swoje mecze 1v1.                                        |

## Scenariusze akceptacyjne

| #   | Given                                 | When                  | Then                                                                                        |
| --- | ------------------------------------- | --------------------- | ------------------------------------------------------------------------------------------- |
| S1  | Zalogowany gracz i gość               | Każdy kończy grę solo | Gra gracza jest w historii i w rankingu z wynikiem z wiadomości `over`; gość nie ma wiersza |
| S2  | Gracz z dwiema grami: 1000 i 3000 pkt | Ktoś otwiera ranking  | Gracz jest w rankingu raz, z wynikiem 3000                                                  |
| S3  | Mecz zalogowanego A z gościem         | Mecz się kończy       | Mecz jest w historii A; w bazie gość ma nazwę `Gość-XXXX` i puste id konta                  |

## Design

```
apps/server/src/db/games.ts, matches.ts   # repozytoria
apps/server/src/play/results.ts           # zapis gier i meczów poza pętlą ticków
apps/server/src/http/api/leaderboard.ts, me.ts
apps/web/src/domains/leaderboard/         # ranking
apps/web/src/domains/account/             # historia gier i meczów w profilu
```

```sql
games   (id bigserial, user_id → users on delete cascade, score int, lines int, level int, ticks int, ended_at timestamptz)
matches (id, winner_id, winner_name, loser_id, loser_name, reason, winner_lines_sent, loser_lines_sent, ticks, ended_at)
        -- id puste dla gościa, nazwa zawsze
```

| Endpoint               | Dostęp | Opis                                           |
| ---------------------- | ------ | ---------------------------------------------- |
| `GET /api/leaderboard` | każdy  | Top 50, najlepszy wynik na gracza (z `gameId`) |
| `GET /api/me/games`    | gracz  | Ostatnie 50 gier solo                          |
| `GET /api/me/matches`  | gracz  | Mecze 1v1 gracza                               |

| Obszar | Decyzja                                                                                                       |
| ------ | ------------------------------------------------------------------------------------------------------------- |
| Zapis  | W chwili `over` lub `result`, poza pętlą ticków: błąd zapisu nie zatrzymuje gry, tylko trafia do logu         |
| Goście | Mecze gości zapisujemy, żeby admin widział wszystkie ([panel-admina](panel-admina.md) R5); gry solo gości nie |

Poza zakresem: ranking 1v1 i ELO, profil publiczny innych graczy, statystyki (PPS, APM), powtórki i audyt gier.
