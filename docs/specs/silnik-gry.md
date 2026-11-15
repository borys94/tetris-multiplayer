# Silnik gry

- **Status:** Aktualny (2026-11-15) · **Historia:** M2, M7 · **ADR-y:** [0004](../adr/0004-deterministyczny-silnik-gry.md), [0010](../adr/0010-pokoj-jako-wspolny-zegar.md)

## Cel

Cała logika gry siedzi w `packages/game-core` jako czyste, deterministyczne funkcje. Ten sam kod liczy grę na serwerze (źródło prawdy) i przewiduje ją w przeglądarce.

## Wymagania

| #   | Wymaganie                                                                                                                                                                                                               |
| --- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| R1  | Plansza 10×20 (+2 ukryte wiersze), 7 klocków, ruch, rotacja z wall kickami, grawitacja, lock delay, czyszczenie linii, hold, kolejka 3 następnych, game over.                                                           |
| R2  | Determinizm: ten sam seed i ta sama sekwencja akcji i ticków dają identyczny stan; losowanie 7-bag z PRNG ze seedem.                                                                                                    |
| R3  | Punktacja i poziomy: punkty za linie zależne od poziomu, punkty za soft i hard drop, poziom co 10 linii, grawitacja przyspiesza z poziomem.                                                                             |
| R4  | Linie śmieci: wyczyszczone linie atakują według tabeli ataku; własne linie najpierw kasują śmieci z kolejki; reszta kolejki wchodzi na planszę przy położeniu klocka bez czyszczenia linii, z dziurą w jednej kolumnie. |
| R5  | `game-core` nie zależy od DOM ani Node, co wymusza jego `tsconfig` (bez `lib: DOM` i bez typów Node).                                                                                                                   |

## Scenariusze akceptacyjne

| #   | Given                                                     | When                                                        | Then                                                                                          |
| --- | --------------------------------------------------------- | ----------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| S1  | Dwie gry z tym samym seedem                               | Ta sama sekwencja akcji i ticków                            | Stany są identyczne; każde kolejne 7 klocków zawiera wszystkie 7 kształtów                    |
| S2  | Klocek przy ścianie lub innym klocku                      | Rotacja                                                     | Rotacja udaje się z przesunięciem (kick), a gdy żaden kick nie pasuje, stan się nie zmienia   |
| S3  | Plansza z 4 prawie pełnymi liniami i pasującym klockiem I | Hard drop                                                   | 4 linie znikają, wiersze nad nimi opadają, wynik rośnie o 800 × poziom, atak = 4 linie        |
| S4  | Nowy klocek nie mieści się w miejscu spawnu               | Spawn                                                       | Gra kończy się, kolejne akcje i ticki nie zmieniają stanu                                     |
| S5  | 2 linie śmieci w kolejce                                  | Gracz czyści 4 linie / kładzie klocek bez czyszczenia linii | Kolejka spada do 0, a atak to 2 linie / 2 linie z dziurą w tej samej kolumnie wchodzą od dołu |

## Design

API (czyste funkcje, stan niemutowalny):

```ts
type Action = "left" | "right" | "rotateCw" | "rotateCcw" | "softDrop" | "hardDrop" | "hold";

createGame(seed: number): GameState;
applyAction(state: GameState, action: Action): GameState;
tick(state: GameState): GameState; // 1 tick = 1/60 s
ghostPiece(state): Piece;
```

| Obszar    | Decyzja                                                                                                                                                                           |
| --------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Moduły    | `game-core/src`: `board`, `pieces`, `rotation`, `random`, `scoring`, `garbage`, `game` (createGame, applyAction, tick)                                                            |
| Czas      | Liczony w tickach (60/s), nie w ms; grawitacja i lock delay (30 ticków, max 15 resetów) w tickach                                                                                 |
| Rotacja   | System rotacji z tabelami wall kicków (osobna tabela dla klocka I), standardowy dla gatunku                                                                                       |
| Losowanie | 7-bag; PRNG `mulberry32(seed)` w `game-core`, bez `Math.random`                                                                                                                   |
| Punktacja | 1/2/3/4 linie = 100/300/500/800 × poziom; soft drop 1 pkt/wiersz, hard drop 2 pkt/wiersz                                                                                          |
| Śmieci    | Tabela ataku 1 → 0, 2 → 1, 3 → 2, 4 → 4 linie. Kolejka w `GameState` (`garbage: {lines, hole}[]`), wysłane linie w `linesSent`. Kolumnę dziury losuje RNG pokoju, jedną na paczkę |

Poza zakresem: T-spiny, combo i back-to-back; inne tryby niż maraton (sprint, ultra).
