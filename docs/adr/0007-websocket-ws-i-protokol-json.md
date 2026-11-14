# ADR-0007: Używaj biblioteki `ws` i typowanego protokołu JSON

- **Status:** Accepted
- **Data:** 2026-11-14
- **Milestone:** M4, M7

## Kontekst

Model z [ADR-0006](0006-serwer-zrodlem-prawdy.md) wymaga dwukierunkowej komunikacji o niskim opóźnieniu: akcje gracza do serwera, snapshoty 10 razy na sekundę do klienta. W M7 ten sam kanał obsłuży pokoje do 16 graczy. Serwer ma mało RAM (limit poda 192 Mi), a wiadomości muszą być walidowane, bo przychodzą z publicznego internetu.

## Rozważane opcje

1. **`ws` + własny protokół JSON:** standardowy WebSocket w przeglądarce, minimalna biblioteka na serwerze, protokół i reconnect piszemy sami.
2. **Socket.IO:** gotowe pokoje, reconnect i fallback na long polling, ale własny protokół na WebSockecie, większy klient i serwer oraz mniejsza kontrola nad tym, co i kiedy idzie po sieci.
3. **Format binarny (np. MessagePack, protobuf):** mniejsze wiadomości, ale trudniejsze debugowanie i dodatkowe zależności.

## Decyzja

Wybieramy **opcję 1**:

- `ws` po stronie serwera na tym samym porcie co Express, ścieżka `/ws`; w przeglądarce natywny `WebSocket`;
- wiadomości JSON z polem `type`, opisane jako unie typów TypeScript w `packages/protocol`, współdzielone przez `web` i `server`;
- walidacja ręczna, bez zależności, w `packages/protocol`; wersja protokołu w wiadomości `hello`, przy niezgodności serwer odpowiada błędem `version`;
- reconnect i wznawianie sesji implementujemy sami (spec 004).

## Konsekwencje

**Pozytywne**

- Mały bundle klienta i niskie zużycie pamięci serwera; pełna kontrola nad ruchem sieciowym, co ułatwi strojenie w M7.
- Wiadomości czytelne w devtools przeglądarki.

**Negatywne**

- Reconnect, heartbeat, limity i pokoje (M7) piszemy i testujemy sami.
- JSON jest większy od formatu binarnego; snapshot pełnego stanu to ok. 2 KB.

## Kiedy wrócić do decyzji

- Metryki z M6 lub testy k6 w M7 pokażą, że rozmiar wiadomości lub koszt `JSON.parse` ogranicza tick serwera: wtedy delta-snapshoty albo format binarny.
