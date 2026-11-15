# Specyfikacje funkcji

Każdy plik opisuje, jak funkcja działa **teraz**. Plan i postęp wydań są w [roadmapie](../roadmap.md), a uzasadnienia decyzji w [ADR-ach](../adr/).

| Spec                                    | Zakres                                                                      | Historia   |
| --------------------------------------- | --------------------------------------------------------------------------- | ---------- |
| [silnik-gry](silnik-gry.md)             | `game-core`: plansza, klocki, rotacja, punktacja, determinizm, linie śmieci | M2, M7     |
| [solo](solo.md)                         | Gra solo przez serwer: sesja, UI, sterowanie, pauza, gość i zalogowany      | M2, M4, M5 |
| [siec-protokol](siec-protokol.md)       | WebSocket, protokół, przewidywanie, reconnect, limity                       | M4, M5, M7 |
| [konta](konta.md)                       | Rejestracja, logowanie, sesje, CSRF, rola admina                            | M5         |
| [ranking-historia](ranking-historia.md) | Zapis gier i meczów, ranking, historia gracza                               | M5, M7     |
| [panel-admina](panel-admina.md)         | Konta, wyniki, pokoje, trwające i zakończone mecze                          | M5, M7     |
| [versus-1v1](versus-1v1.md)             | Pokoje publiczne i prywatne, mecz, rewanż                                   | M7         |
| [infrastruktura](infrastruktura.md)     | AWS, k3s, Helm, CD, drain, Postgres, backup                                 | M3–M7      |
| [obserwowalnosc](obserwowalnosc.md)     | Logi, metryki, Grafana, alerty, test k6                                     | M6, M7     |
| [fundament-repo](fundament-repo.md)     | Monorepo, TS, lint, granice warstw, testy, CI                               | M1, M2, M7 |

## Jak pracujemy ze specami

- **Format:** Cel, Wymagania (~5), Scenariusze akceptacyjne (Given/When/Then), Design (struktura i tabela decyzji), Poza zakresem. Odwołania w kodzie i testach: `spec <nazwa> R2`, np. `(spec versus-1v1, S4)`.
- **Zmiana funkcji:** milestone edytuje specy, których dotyczy (np. M8: `versus-1v1`, `silnik-gry`, `panel-admina`). Na czas pracy spec dostaje status `W toku (Mx)` i sekcję **Zadania** (`#`, zadanie, pokrywa, status). Po ukończeniu Zadania znikają, status wraca na `Aktualny (data)`, a milestone trafia do Historii.
- **Nowa funkcja:** nowy plik `<nazwa>.md` w tym formacie i wiersz w tabeli powyżej.
- **Numeracja:** numery wymagań i scenariuszy się nie zmieniają; usunięte zostawiamy jako `~~R3~~ (usunięte w Mx)`, nowe dopisujemy na końcu.
