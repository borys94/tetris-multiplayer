# ADR-0003: Ogranicz pokój battle royale do 16 graczy

- **Status:** Accepted
- **Data:** 2026-11-13
- **Milestone:** M7

## Kontekst

Gra ma tryby singleplayer, 1v1 i battle royale. Limit graczy w pokoju wyznacza architekturę serwera: czy stan pokoju mieści się w jednym procesie, jak duże są wiadomości i jak skalujemy.

## Rozważane opcje

1. **8 graczy:** najprościej, ale mało widowiskowo.
2. **16 graczy:** kompromis.
3. **99 graczy:** wymaga optymalizacji protokołu (delty, binarny format) i może przekroczyć możliwości jednego procesu.

## Decyzja

Wybieramy **maksymalnie 16 graczy w pokoju**. 1v1 to pokój z limitem 2 graczy.

- Cały pokój żyje w jednym procesie Node i nie rozpraszamy stanu gry.
- Stan jest mały (16 plansz 10×20), więc wystarczą wiadomości JSON. Optymalizacje (delty, format binarny) wprowadzamy dopiero, gdy wskażą je metryki.
- Skalujemy liczbą pokoi, nie wielkością pokoju. Połączenia gracza trafiają do poda z jego pokojem (sticky sessions).

## Konsekwencje

**Pozytywne**
- Prosty model serwera i protokołu.
- Jeden mechanizm pokoi obsługuje 1v1 i battle royale.

**Negatywne**
- Brak trybu „masowego” (np. 99 graczy) bez przeprojektowania.
- Sticky sessions komplikują rolling deploy: restart poda kończy trwające w nim mecze.

## Kiedy wrócić do decyzji

- Chcemy pokoi większych niż 16 graczy.
- Metryki z M6 pokazują, że tick przy 16 graczach przekracza budżet czasu.
