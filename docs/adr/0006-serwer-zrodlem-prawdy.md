# ADR-0006: Licz grę na serwerze, a klientowi pozwól tylko przewidywać

- **Status:** Accepted
- **Data:** 2026-11-14
- **Milestone:** M4, M5, M7

## Kontekst

Od M4 gra jest publiczna, a od M5 wyniki trafiają do rankingu ([ADR-0003](0003-publiczne-wydanie-tylko-z-serwerem.md)). Wynik nie może pochodzić z przeglądarki. Jednocześnie gra wymaga reakcji na klawisz w tej samej klatce, a gracze mają RTT od kilkudziesięciu do kilkuset ms. `game-core` jest deterministyczny i liczony w tickach ([ADR-0004](0004-deterministyczny-silnik-gry.md)), więc klient i serwer mogą liczyć ten sam stan.

## Rozważane opcje

1. **Klient liczy, serwer weryfikuje na końcu:** klient wysyła seed i log akcji po game over, serwer odtwarza grę. Proste, ale klient kontroluje czas (może „zatrzymać” grawitację, dopisując ticki) i nie ma podstawy pod multiplayer.
2. **Serwer liczy, klient tylko wyświetla:** każdy ruch czeka na odpowiedź serwera; przy RTT 100 ms gra jest odczuwalnie opóźniona.
3. **Serwer liczy, klient przewiduje i uzgadnia:** klient stosuje akcje lokalnie od razu i wysyła je z numerem ticka; serwer stosuje je w swoim zegarze i co kilka ticków wysyła snapshot, który klient porównuje ze swoją historią.

## Decyzja

Wybieramy **opcję 3**:

- czas gry wyznacza zegar serwera; symulacja serwera idzie za zegarem o bufor wejścia, żeby akcje z typowym RTT trafiały dokładnie na tick, na którym gracz je wykonał. Bufor jest parametrem konfiguracji, domyślnie 150 ms. Większy bufor eliminuje korekty u graczy z wyższym RTT, ale o tyle samo wydłuża okno, w którym zmodyfikowany klient może opóźnić akcję i podpisać ją wcześniejszym tickiem (przy lock delay 500 ms: 150 ms to ok. 1/3, 300 ms ponad połowa);
- akcja spóźniona ponad bufor trafia na bieżący tick serwera (nie da się cofnąć czasu), a akcja z przyszłości jest odrzucana (nie da się go przyspieszyć);
- klient nigdy nie wysyła stanu ani wyniku; wynik, game over i ranking (M5) biorą się wyłącznie ze stanu serwera;
- seed jest jawny dla klienta, bo potrzebuje go do przewidywania. Akceptujemy, że zmodyfikowany klient może poznać kolejność klocków dalej niż podgląd 3 następnych.

## Konsekwencje

**Pozytywne**

- Wynik jest wiarygodny, a gra przy RTT do wartości bufora (domyślnie 150 ms) działa jak lokalna.
- Ten sam model (zegar serwera, akcje z tickiem, snapshoty) przenosi się na pokoje w M7.

**Negatywne**

- Klient musi trzymać historię stanów i akcji oraz umieć odtworzyć grę od snapshotu.
- Sesje żyją w pamięci jednego procesu: restart poda kończy trwające gry, a skalowanie wymaga sticky sessions albo przeniesienia sesji (M7).
- Przy RTT powyżej bufora gracz widzi korekty pozycji klocka.

## Kiedy wrócić do decyzji

- Ranking (M5) pokaże wyniki możliwe tylko dzięki znajomości dalszej kolejki klocków: wtedy serwer wysyła kolejkę zamiast seeda.
- Metryki (M6) pokażą rozkład RTT graczy: wtedy rewidujemy domyślne 150 ms (np. 200–250 ms, jeśli wielu graczy ma RTT powyżej bufora).
- W M7 bufor dla pokoi może być inny niż dla singleplayera, bo opóźnia też linie śmieci między graczami.
