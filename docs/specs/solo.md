# Gra solo

- **Status:** Aktualny (2026-11-15) · **Historia:** M2, M4, M5 · **ADR-y:** [0003](../adr/0003-publiczne-wydanie-tylko-z-serwerem.md), [0006](../adr/0006-serwer-zrodlem-prawdy.md)

## Cel

Gracz gra sam w przeglądarce. Przeglądarka wysyła tylko akcje, a stan i wynik liczy serwer ([silnik-gry](silnik-gry.md) na serwerze, [siec-protokol](siec-protokol.md)). Wynik zalogowanego trafia do [rankingu](ranking-historia.md); gość gra bez zapisu.

## Wymagania

| #   | Wymaganie                                                                                                                                                                          |
| --- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| R1  | Serwer prowadzi sesję gry: losuje seed, liczy ticki we własnym zegarze, stosuje akcje klienta i rozstrzyga game over i wynik. Klient nie wysyła stanu ani wyniku, tylko akcje.     |
| R2  | UI: plansza na canvasie z ghost piece, panel z hold, następnymi klockami, wynikiem, poziomem i liniami; start, pauza, restart; status połączenia; sterowanie klawiaturą z DAS/ARR. |
| R3  | Pauza zatrzymuje zegar sesji, a zerwanie połączenia działa jak pauza. Sesja czeka na powrót gracza 60 s, potem serwer ją usuwa.                                                    |
| R4  | Zalogowany gra pod swoim kontem i jego wynik się zapisuje; gość gra bez zapisu i po game over widzi zachętę do założenia konta.                                                    |

## Scenariusze akceptacyjne

| #   | Given                          | When                                                             | Then                                                                                                                     |
| --- | ------------------------------ | ---------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| S1  | Nowa sesja z seedem od serwera | Klient wysyła sekwencję akcji, a gra trwa do game over           | Wynik pokazany graczowi pochodzi z wiadomości serwera i równa się wynikowi odtworzonemu z seeda i logu akcji             |
| S2  | Otwarta strona gry             | Start, strzałki, spacja, `P`, restart                            | Klocek reaguje na klawisze, HUD się aktualizuje, pauza zatrzymuje grę, restart zaczyna od nowa                           |
| S3  | Gra w toku                     | Połączenie zrywa się na 10 s, potem wraca / nie wraca przez 60 s | Po powrocie gra jest wstrzymana w tym samym stanie i da się ją wznowić; po 60 s sesja znika, a klient proponuje nową grę |
| S4  | Zalogowany gracz i gość        | Każdy kończy grę                                                 | Gra gracza jest w historii i rankingu; gość nie ma wiersza w bazie, a UI proponuje założenie konta                       |

## Design

```
apps/server/src/game/        # Session (zegar, bufor wejścia, pauza, snapshoty), SessionStore (TTL, limity)
apps/server/src/play/        # Players (sesja ↔ połączenie, wznawianie), wspólna pętla gry, zapis wyniku
apps/web/src/core/play/      # Predictor, klawiatura (DAS/ARR), pętla, rysowanie planszy
apps/web/src/domains/game/model/solo-session.ts   # ekrany gry, wiadomości serwera, pauza po rozłączeniu
apps/web/src/domains/game/SoloGame.tsx  # widok gry i HUD
apps/web/src/board/                  # plansza, podgląd klocka, pętla gry (wspólne z 1v1)
```

| Obszar     | Decyzja                                                                                                                      |
| ---------- | ---------------------------------------------------------------------------------------------------------------------------- |
| Sesja      | Jedna sesja gry na połączenie, w pamięci procesu (1 replika); limit sesji łącznie `MAX_SESSIONS` (200)                       |
| Pętla      | Web: `requestAnimationFrame` z akumulatorem stałego kroku (60 ticków/s), niezależna od FPS                                   |
| Input      | Klawisze → akcje; DAS 10 ticków, ARR 2 ticki liczone po stronie klienta, do silnika trafiają pojedyncze akcje                |
| Renderer   | Canvas 2D; stan gry poza Reactem (`domains/game/model/`), React tylko dla HUD i ekranów                                      |
| Wznowienie | Pauza i rozłączenie zatrzymują zegar sesji; wznowienie przez `resume` z tokenem sesji ([siec-protokol](siec-protokol.md) R3) |
| Wynik      | Wiersz `games` zapisany w chwili `over`, poza pętlą ticków ([ranking-historia](ranking-historia.md) R1)                      |

Sterowanie: ←/→ ruch, ↓ soft drop, spacja hard drop, ↑/`X` rotacja w prawo, `Z` w lewo, `C` hold, `P` pauza.

Poza zakresem: dźwięk, sterowanie dotykowe, własne klawisze i ustawienia DAS/ARR, gra offline.
