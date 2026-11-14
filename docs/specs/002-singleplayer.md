# Spec 002 · Singleplayer lokalnie

- **Milestone:** M2 · **Status:** Approved (2026-11-14) · **ADR-y:** [0004 Deterministyczny silnik gry](../adr/0004-deterministyczny-silnik-gry.md)

## Cel

Grywalny singleplayer w przeglądarce. Cała logika siedzi w `game-core` jako czyste, deterministyczne funkcje, żeby w M4 ten sam kod mógł działać na serwerze jako źródło prawdy.

## Wymagania

| #   | Wymaganie                                                                                                                                                             |
| --- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| R1  | Silnik: plansza 10×20 (+2 ukryte wiersze), 7 klocków, ruch, rotacja z wall kickami, grawitacja, lock delay, czyszczenie linii, hold, kolejka 3 następnych, game over. |
| R2  | Determinizm: ten sam seed i ta sama sekwencja akcji i ticków dają identyczny stan; losowanie 7-bag z PRNG ze seedem.                                                  |
| R3  | Punktacja i poziomy: punkty za linie zależne od poziomu, punkty za soft i hard drop, poziom co 10 linii, grawitacja przyspiesza z poziomem.                           |
| R4  | UI: plansza na canvasie z ghost piece, panel z hold, następnymi klockami, wynikiem, poziomem i liniami; start, pauza, restart; sterowanie klawiaturą z DAS/ARR.       |
| R5  | `game-core` nie zależy od DOM ani Node, co wymusza jego `tsconfig` (bez `lib: DOM` i bez typów Node).                                                                 |

## Scenariusze akceptacyjne

| #   | Given                                                     | When                                  | Then                                                                                           |
| --- | --------------------------------------------------------- | ------------------------------------- | ---------------------------------------------------------------------------------------------- |
| S1  | Dwie gry z tym samym seedem                               | Ta sama sekwencja akcji i ticków      | Stany są identyczne; każde kolejne 7 klocków zawiera wszystkie 7 kształtów                     |
| S2  | Klocek przy ścianie lub innym klocku                      | Rotacja                               | Rotacja udaje się z przesunięciem (kick), a gdy żaden kick nie pasuje, stan się nie zmienia    |
| S3  | Plansza z 4 prawie pełnymi liniami i pasującym klockiem I | Hard drop                             | 4 linie znikają, wiersze nad nimi opadają, wynik rośnie o 800 × poziom                         |
| S4  | Nowy klocek nie mieści się w miejscu spawnu               | Spawn                                 | Gra kończy się, kolejne akcje i ticki nie zmieniają stanu                                      |
| S5  | Otwarta strona gry                                        | Start, strzałki, spacja, `P`, restart | Klocek reaguje na klawisze, HUD się aktualizuje, pauza zatrzymuje grę, restart zaczyna od nowa |

## Design

API `game-core` (czyste funkcje, stan niemutowalny):

```ts
type Action = "left" | "right" | "rotateCw" | "rotateCcw" | "softDrop" | "hardDrop" | "hold";

createGame(seed: number): GameState;
applyAction(state: GameState, action: Action): GameState;
tick(state: GameState): GameState; // 1 tick = 1/60 s
```

| Obszar         | Decyzja                                                                                                                                    |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| Czas           | Liczony w tickach (60/s), nie w ms; grawitacja i lock delay (30 ticków, max 15 resetów) w tickach                                          |
| Rotacja        | System rotacji z tabelami wall kicków (osobna tabela dla klocka I), standardowy dla gatunku                                                |
| Losowanie      | 7-bag; PRNG `mulberry32(seed)` w `game-core`, bez `Math.random`                                                                            |
| Punktacja      | 1/2/3/4 linie = 100/300/500/800 × poziom; soft drop 1 pkt/wiersz, hard drop 2 pkt/wiersz                                                   |
| Moduły         | `game-core/src`: `board`, `pieces`, `rotation`, `random`, `scoring`, `game` (createGame, applyAction, tick)                                |
| Pętla w `web`  | `requestAnimationFrame` z akumulatorem stałego kroku (60 ticków/s), niezależna od FPS                                                      |
| Input w `web`  | Klawisze → akcje; DAS 10 ticków, ARR 2 ticki liczone po stronie klienta, do silnika trafiają pojedyncze akcje                              |
| Renderer       | Canvas 2D w komponencie React; stan gry poza Reactem (ref), React tylko dla HUD i ekranów                                                  |
| Style          | CSS Modules w SCSS (`*.module.scss` obok komponentu, `sass-embedded`); tokeny kolorów jako zmienne CSS w `styles/global.scss`              |
| Wygląd i nazwa | Nazwa robocza „Tetris Multiplayer”; przed publicznym wydaniem (M4) zmiana na własną, bo „Tetris” to znak towarowy. Oprawa graficzna własna |

Sterowanie: ←/→ ruch, ↓ soft drop, spacja hard drop, ↑/`X` rotacja w prawo, `Z` w lewo, `C` hold, `P` pauza.

Poza zakresem: dźwięk, T-spiny i combo (M7 przy garbage lines), sterowanie dotykowe, zapis wyników (M5).

## Zadania

| #   | Zadanie                                                                                  | Pokrywa               | Status |
| --- | ---------------------------------------------------------------------------------------- | --------------------- | ------ |
| T1  | `board`, `pieces`, `rotation`: plansza, klocki, kolizje, rotacja z kickami               | R1, S2                | ☑      |
| T2  | `random`, `scoring`, `game`: 7-bag, tick, grawitacja, lock delay, linie, hold, game over | R1–R3, R5, S1, S3, S4 | ☑      |
| T3  | `web`: pętla stałego kroku, input z DAS/ARR, renderer canvas z ghost piece               | R4, S5                | ☑      |
| T4  | `web`: HUD (hold, next, wynik, poziom, linie), ekrany start, pauza, game over, restart   | R4, S5                | ☑      |
