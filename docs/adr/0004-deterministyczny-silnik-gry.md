# ADR-0004: Buduj silnik gry jako czyste, deterministyczne funkcje liczone w tickach

- **Status:** Accepted
- **Data:** 2026-11-13
- **Milestone:** M2, M4, M7

## Kontekst

W M2 silnik działa w przeglądarce, a od M4 ten sam `game-core` działa na serwerze jako źródło prawdy ([ADR-0003](0003-publiczne-wydanie-tylko-z-serwerem.md)). Serwer musi móc odtworzyć grę z seeda i sekwencji akcji. Zależność od zegara, losowości przeglądarki albo współdzielonego stanu sprawi, że klient i serwer dojdą do różnych wyników.

## Decyzja

`game-core` to czyste funkcje `createGame(seed)`, `applyAction(state, action)` i `tick(state)`:

- czas liczymy w tickach (60/s), nigdy w ms; `game-core` nie używa `Date.now()`, `performance.now()` ani timerów;
- losowość pochodzi tylko z PRNG ze seedem przechowywanym w stanie; zakaz `Math.random`;
- stan jest niemutowalny: funkcje zwracają nowy stan;
- brak zależności od DOM i Node.

Pętla czasu rzeczywistego, input i renderowanie są poza `game-core` (`web`, a od M4 `server`).

## Konsekwencje

**Pozytywne**

- Ten sam kod na kliencie i serwerze; grę da się odtworzyć i przetestować z sekwencji akcji.
- Proste testy: bez mocków zegara i losowości.

**Negatywne**

- Kopiowanie stanu przy każdej zmianie kosztuje więcej niż mutacja (dla planszy 10×22 to pomijalne).
- Wszystkie efekty uboczne (czas, dźwięk, animacje) trzeba obsłużyć poza silnikiem.

## Kiedy wrócić do decyzji

- Profilowanie w M7 pokaże, że kopiowanie stanu ogranicza tick serwera przy 16 graczach.
