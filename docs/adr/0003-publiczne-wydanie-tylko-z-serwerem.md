# ADR-0003: Udostępniaj grę publicznie dopiero, gdy liczy ją serwer

- **Status:** Accepted
- **Data:** 2026-11-13
- **Milestone:** M3, M4

## Kontekst

Roadmapa zakłada deploy na AWS (M3) przed przeniesieniem logiki gry na serwer (M4). Do końca M4 gra jest liczona w przeglądarce, więc gracz może zmanipulować stan i wynik. Od M5 wyniki trafiają do rankingu, a ich wiarygodność jest kluczowa.

## Rozważane opcje

1. **Publiczny prod od M3:** szybciej, ale publicznie działa wersja podatna na oszukiwanie.
2. **Zamiana kolejności M3 i M4:** łamie zatwierdzoną roadmapę i opóźnia sprawdzenie pipeline'u.
3. **Deploy w M3 za zamkniętym dostępem, otwarcie prod w M4.**

## Decyzja

Wybieramy **opcję 3**:

- w M3 beta i prod są zamknięte (middleware Traefika: basic auth lub IP allowlist);
- w M4, po przeniesieniu liczenia gry na serwer, otwieramy prod publicznie. To jawny krok z kryterium ukończenia;
- beta pozostaje zamknięta na stałe;
- publicznie udostępniamy tylko grę, której stan i wynik liczy serwer.

## Konsekwencje

**Pozytywne**

- Pipeline i infrastrukturę sprawdzamy na prawdziwym AWS wcześnie.
- Żadna wersja liczona w przeglądarce nie trafia do publicznych użytkowników.

**Negatywne**

- Pierwsze publiczne wydanie przesuwa się na koniec M4 (v0.3).
- Trzeba utrzymać mechanizm zamkniętego dostępu i jego dane uwierzytelniające.

## Kiedy wrócić do decyzji

- Pojawi się tryb, w którym liczenie po stronie klienta jest akceptowalne (np. tryb offline bez rankingu).
