# Panel admina

- **Status:** Aktualny (2026-11-15) · **Historia:** M5, M7

## Cel

Konto z rolą `admin` ([konta](konta.md) R5) zarządza kontami i wynikami oraz podgląda pokoje, trwające mecze i wyniki meczów 1v1.

## Wymagania

| #   | Wymaganie                                                                                                                                                                          |
| --- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| R1  | Panel i jego API są dostępne tylko dla roli `admin`, sprawdzanej na serwerze.                                                                                                      |
| R2  | Konta: wyszukiwanie, nadawanie i odbieranie roli admina, blokada i odblokowanie (blokada kończy sesje konta), hasło tymczasowe. Admin nie może odebrać roli ani zablokować siebie. |
| R3  | Wyniki: gry wybranego gracza i usunięcie wyniku.                                                                                                                                   |
| R4  | Pokoje: wszystkie otwarte pokoje (publiczne i prywatne, z kodem, stanem i graczami) i trwające mecze (gracze, czas, wysłane linie), odświeżane co kilka sekund.                    |
| R5  | Mecze: tabela wszystkich zakończonych meczów 1v1 z wyszukiwaniem po graczu.                                                                                                        |

## Scenariusze akceptacyjne

| #   | Given                                                                          | When                                                                           | Then                                                                                                                                                  |
| --- | ------------------------------------------------------------------------------ | ------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| S1  | Gracz i admin                                                                  | Gracz wywołuje API admina / admin blokuje gracza i ustawia mu hasło tymczasowe | Gracz dostaje 403; zablokowany traci sesje (API 401, WebSocket gra jako gość) i nie może się zalogować; po odblokowaniu loguje się hasłem tymczasowym |
| S2  | Jedyny admin                                                                   | Próbuje odebrać sobie rolę lub się zablokować                                  | Serwer odrzuca zmianę                                                                                                                                 |
| S3  | Otwarte pokoje A (prywatny) i B (publiczny), trwa mecz w B, 3 mecze zakończone | Admin otwiera panel                                                            | Widzi oba pokoje z kodami i graczami, mecz w B z rosnącym czasem i 3 mecze w tabeli; po końcu meczu w B znika on z trwających i pojawia się w tabeli  |

## Design

```
apps/server/src/accounts/admin.ts      # zmiany kont w transakcjach
apps/server/src/http/api/admin.ts      # router /api/admin
apps/web/src/domains/admin-panel/       # AdminView: UsersPanel, RoomsPanel, MatchesPanel
```

| Endpoint                                                        | Opis                                                                                   |
| --------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| `GET /api/admin/users?q=`, `PATCH /api/admin/users/:id`         | Wyszukiwanie; zmiana `role` (`admin`/`null`) i `disabled`                              |
| `POST /api/admin/users/:id/password`                            | Hasło tymczasowe (pokazane raz, wylogowuje konto)                                      |
| `GET /api/admin/users/:id/games`, `DELETE /api/admin/games/:id` | Gry gracza; usunięcie wyniku                                                           |
| `GET /api/admin/rooms`                                          | Otwarte pokoje z pamięci serwera; dla trwającego meczu czas i wysłane linie            |
| `GET /api/admin/matches?q=&before=`                             | Zakończone mecze od najnowszych, po 50 (stronicowanie po `id`), filtr po nazwie gracza |

| Obszar      | Decyzja                                                                                                                                                         |
| ----------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Pokoje      | Pokoje i mecze są tylko w pamięci, więc panel odpytuje `GET /api/admin/rooms` co 3 s zamiast osobnego kanału WebSocket. Kody pokoi prywatnych widzi tylko admin |
| Uprawnienia | Middleware `requireAdmin` na całym routerze; UI tylko ukrywa zakładkę                                                                                           |

Poza zakresem: zamykanie pokoi i przerywanie meczów, podgląd plansz na żywo, ban czasowy, log działań admina.
