# ADR-0010: Licz mecz w pokoju ze wspólnym zegarem i śmieciami jako zdarzeniami na ticku

- **Status:** Accepted
- **Data:** 2026-11-14
- **Milestone:** M7, M8

## Kontekst

W M7 dwóch graczy gra mecz 1v1, a w M8 do 16 graczy gra w jednym meczu; ich gry wpływają na siebie przez linie śmieci. Od M4 każda gra to `Session` z własnym zegarem, który klient może wstrzymać, i z buforem wejścia 150 ms ([ADR-0006](0006-serwer-zrodlem-prawdy.md)). `game-core` jest deterministyczny ([ADR-0004](0004-deterministyczny-silnik-gry.md)). Serwer ma jeden proces Node.js i wspólną pętlę 60 ticków/s; budżet ticka to 16,7 ms, a alert z M6 odpala się przy p99 > 8 ms.

## Rozważane opcje

1. **Osobne sesje połączone przez zdarzenia:** każdy gracz ma swoją `Session` i zegar, a pokój tylko przekazuje śmieci. Mało zmian, ale zegary się rozjeżdżają (różne chwile `resume`, pauzy), więc „kiedy” dotarły śmieci zależy od gracza i nie da się odtworzyć meczu.
2. **Pokój ze wspólnym zegarem:** pokój ma jeden zegar startujący po odliczaniu, bez pauzy; w każdym ticku przesuwa gry wszystkich graczy, a śmieci wysłane na ticku `t` trafiają do kolejek celów na ticku `t`. Każdy gracz zachowuje swój bufor wejścia i przewidywanie.
3. **Lockstep:** klienci liczą wszystkie plansze, serwer tylko rozsyła akcje. Mniej pracy serwera, ale tick czeka na najwolniejszego gracza, a wynik znów liczy przeglądarka (sprzeczne z ADR-0003 i ADR-0006).

## Decyzja

Wybieramy **opcję 2**:

- `Room` ma stany `lobby → countdown → playing → finished`, jeden zegar i jedną kolejność przetwarzania graczy w ticku (stała, według kolejności dołączenia);
- śmieci są polem `GameState` (kolejka paczek `{lines, hole}`), zmienianym przez funkcje `game-core`, więc wpływ śmieci na planszę jest deterministyczny i testowalny bez serwera;
- klient przewiduje tylko własną planszę; śmieci poznaje ze snapshotu, więc ich wejście może dać korektę stanu, tak jak spóźniona akcja;
- pauza nie istnieje w meczu; rozłączony gracz dalej gra bez inputów;
- wszyscy gracze w pokoju mają ten sam seed.

## Konsekwencje

**Pozytywne**

- Kolejność zdarzeń (kto kogo zaatakował, kto odpadł pierwszy) jest jednoznaczna, a KO i miejsca nie zależą od lagów między graczami.
- Mecz da się odtworzyć z seeda i logu akcji, co ułatwia testy i ewentualne replaye.
- Model ADR-0006 (bufor, akcje z tickiem, snapshoty) działa bez zmian dla pojedynczej planszy.

**Negatywne**

- Koszt ticka pokoju rośnie liniowo z liczbą graczy (16 gier w jednym ticku), a wszystkie pokoje dzielą jeden wątek.
- Bufor wejścia opóźnia też atak: śmieci docierają do celu najwcześniej po buforze nadawcy i RTT celu.
- Wspólny seed pozwala zmodyfikowanemu klientowi poznać kolejkę klocków wszystkich graczy (i tak zna swoją, ADR-0006).

## Kiedy wrócić do decyzji

- p99 ticka pokoju zbliża się do 8 ms przy 16 graczach: wtedy osobny wątek (`worker_threads`) na pokoje albo rzadsza symulacja przeciwników.
- Gracze zgłaszają, że śmieci „pojawiają się znikąd” (częste korekty): wtedy ostrzeżenie o nadchodzących śmieciach z wyprzedzeniem (opóźnienie wejścia o N ticków).
