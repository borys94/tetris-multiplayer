# Mecz 1v1 w pokojach

- **Status:** Aktualny (2026-11-15) · **Historia:** M7 · **ADR-y:** [0006](../adr/0006-serwer-zrodlem-prawdy.md), [0010](../adr/0010-pokoj-jako-wspolny-zegar.md)

## Cel

Dwóch graczy gra przeciwko sobie: czyszczenie linii wysyła przeciwnikowi linie śmieci ([silnik-gry](silnik-gry.md) R4), a kto pierwszy się przepełni, przegrywa. Mecz odbywa się w pokoju publicznym (lista) albo prywatnym (kod). Pokój jest fundamentem pod battle royale (M8).

## Wymagania

| #   | Wymaganie                                                                                                                                                                                                                                           |
| --- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| R1  | Zakładanie: zalogowany tworzy pokój publiczny albo prywatny, gość tylko publiczny. Każdy ma najwyżej jeden otwarty pokój. Pokój jest otwarty, dopóki jest w nim założyciel; jego wyjście lub wygaśnięcie jego sesji zamyka pokój.                   |
| R2  | Dołączanie: lista pokoi publicznych z wolnym miejscem (nazwa założyciela, czas oczekiwania) odświeżana na żywo; do prywatnego wchodzi się 6-znakowym kodem lub linkiem `/pokoj/<kod>`. Pełny, zamknięty lub nieistniejący pokój daje komunikat.     |
| R3  | Mecz: start po „Gotowe” obu graczy i odliczaniu 3 s. Serwer liczy mecz we wspólnym zegarze pokoju, bez pauzy, z tym samym seedem dla obu. Gracz widzi własną planszę z kolejką śmieci i pełną planszę przeciwnika.                                  |
| R4  | Koniec: przepełnienie, wyjście w trakcie meczu lub brak powrotu w TTL sesji to przegrana. Rozłączony gracz nie pauzuje gry i po powrocie w TTL wraca do meczu. Po meczu obaj widzą wynik i mogą zagrać rewanż; wyjście przeciwnika zwalnia miejsce. |

## Scenariusze akceptacyjne

| #   | Given                                    | When                                                                                             | Then                                                                                                                                                     |
| --- | ---------------------------------------- | ------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| S1  | Zalogowany A i gość B                    | A zakłada pokój prywatny / B zakłada publiczny, a potem drugi / B próbuje założyć prywatny       | A dostaje kod i link / pokój B jest na liście u innych; drugi pokój B i pokój prywatny gościa kończą się błędem                                          |
| S2  | Pokój A (prywatny) i pokój B (publiczny) | C dołącza do B z listy, a D wpisuje kod A / E wpisuje zły kod lub wchodzi do pełnego pokoju B    | C i D trafiają do pokoi, po „Gotowe” obu graczy rusza odliczanie, a pokój B znika z listy / E widzi komunikat i zostaje w lobby                          |
| S3  | Mecz A–C                                 | C czyści 4 linie, a A kładzie klocek bez czyszczenia                                             | A dostaje 4 linie z dziurą w jednej kolumnie; stan u klienta A zgadza się ze snapshotem serwera                                                          |
| S4  | Trwający mecz zalogowanych A i C         | A zamyka kartę na 10 s i wraca / C przepełnia planszę / klient wysyła `pause` lub akcje po końcu | A wraca do meczu z planszą, która opadała / A wygrywa, obaj widzą wynik i „Rewanż”, mecz jest w historii obu / serwer odrzuca wiadomość błędem `invalid` |

## Design

```
apps/server/src/rooms/       # Room (waiting → countdown → playing → finished), Match (rozgrywka), RoomStore, lista publicznych
apps/server/src/play/        # Players: przejście sesji do pokoju, wspólna pętla dla sesji i pokoi
apps/web/src/domains/versus/model/        # lobby.ts (lista, pokój, błędy), match-session.ts (mecz, przewidywanie)
apps/web/src/domains/versus/              # Lobby, RoomCard, Match (dwie plansze, kolejka śmieci, wynik, rewanż)
```

Wiadomości pokoi i meczu: [siec-protokol](siec-protokol.md).

| Obszar       | Decyzja                                                                                                                                                                                                                                           |
| ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Model pokoju | Pokój ma jeden zegar i pętlę ticków dla wszystkich graczy; każdy ma własny `GameState` i bufor wejścia. Śmieci to zdarzenie na ticku symulacji, więc mecz jest deterministyczny przy danym logu akcji. Limit graczy to parametr pokoju (ADR-0010) |
| Właściciel   | Limit „jeden otwarty pokój” po `userId` dla zalogowanych (także w kilku kartach) i po sesji gry dla gości. Gość z nową sesją może założyć nowy pokój; poprzedni zamyka się po TTL. Prywatność to tylko brak na liście                             |
| Kody         | 6 znaków z alfabetu bez `0/O/1/I` (ok. 10⁹ kombinacji), ważne, dopóki pokój jest otwarty. Zgadywanie ogranicza limit wiadomości                                                                                                                   |
| Przeciwnik   | Pełny stan planszy przeciwnika (z aktywnym klockiem) w każdym snapshocie, 10/s, ok. 2 KB; przy dwóch graczach < 50 KB/s na mecz, więc bez miniatur i delt. Klient poznaje śmieci ze snapshotu, więc ich wejście to korekta stanu                  |
| Rozłączenie  | Gracz bez połączenia gra bez inputów (grawitacja i lock delay działają); wznowienie przez `resume` bez pauzy. Wyjście z poczekalni przed startem zwalnia miejsce                                                                                  |
| Limity       | `MAX_ROOMS` (50); gracze w pokojach liczą się do `MAX_SESSIONS`. Jedna sesja gry = jeden pokój naraz; w pokoju nie ma solo ani pauzy                                                                                                              |
| Nazwy        | Goście grają jako `Gość-XXXX`, zalogowani pod loginem. Wynik meczu: [ranking-historia](ranking-historia.md) R2                                                                                                                                    |

Poza zakresem (część w M8): więcej niż 2 graczy, szybki mecz i matchmaking, targeting, eliminacje i KO; czat; obserwatorzy; wyrzucanie gracza z pokoju.
