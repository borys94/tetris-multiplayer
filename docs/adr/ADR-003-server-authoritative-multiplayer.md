# ADR-003 — Server-authoritative multiplayer

- **Status:** Accepted — zatwierdzono przez właściciela 2026-11-13
- **Data:** 2026-11-13
- **Powiązania:** kandydat ADR-003 w [`specs/001-mvp-architecture/design.md`](../../specs/001-mvp-architecture/design.md) §7; FR-06, FR-09, NFR-03 i S-03 w `specs/001-mvp-architecture/`; zasady architektury w [`AGENTS.md`](../../AGENTS.md)

## Context

Planowany tryb 1v1 (M3, lekcje 26–30) wymaga jednego, wiarygodnego wyniku meczu. Gracze grają w przeglądarce, którą kontrolują, więc dowolny stan wysłany przez klienta może być sfałszowany. Silnik gry jest czystą, deterministyczną biblioteką TypeScript (`@tetris/game-engine`, kandydat ADR-002), którą może uruchomić zarówno klient, jak i serwer.

Stan na dziś: multiplayer, serwer gry i protokół WebSocket **nie są zaimplementowane**; repozytorium zawiera szkielety workspace'ów (L03).

## Decision

Serwer jest jedynym źródłem prawdy o stanie i wyniku meczu.

- Klient wysyła wyłącznie **intencje** (akcje sterowania z numerem sekwencji), nigdy stanu planszy ani wyniku.
- Serwer waliduje każdą intencję (kontrakt Zod, uprawnienie sesji, aktualność, duplikaty), wykonuje ją na współdzielonym silniku i rozsyła autorytatywne aktualizacje.
- Klient może symulować lokalnie (predykcja), ale w razie rozbieżności stan serwera wygrywa (reconciliation).
- Odrzucone wejście nie zmienia stanu meczu.

Szczegóły protokołu, ticków i reconnect ustalą lekcje 26–30.

## Alternatives

| Wariant | Powód odrzucenia |
|---|---|
| Klient wylicza wynik i raportuje go serwerowi | trywialne oszustwa; serwer nie potrafi zweryfikować wyniku bez własnej symulacji |
| Deterministic lockstep (serwer tylko przekazuje wejścia, symulują obaj klienci) | brak arbitra przy rozbieżności lub manipulacji klienta; opóźnienie gry zależne od najwolniejszego gracza |
| Symulacja na kliencie + weryfikacja replay po meczu | oszustwo wykrywane dopiero po meczu; podwójna złożoność |

## Consequences

**Pozytywne**
- Mniejsza powierzchnia oszustw; jeden spójny wynik dla obu graczy.
- Log intencji przetwarzanych przez serwer umożliwia replay i weryfikację determinizmu (L35).

**Negatywne / koszty**
- Serwer utrzymuje stan aktywnych meczów i zużywa CPU na symulację — wpływa na skalowanie i własność sesji (L54).
- Opóźnienie sieci wymaga predykcji i reconciliation po stronie klienta (L30).
- Awaria procesu serwera może przerwać mecz; polityka odzyskiwania wymaga osobnej decyzji (001 design §8).
- Wymagana dyscyplina determinizmu silnika i zgodność jego wersji między klientem a serwerem.
