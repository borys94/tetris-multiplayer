# Sieć i protokół

- **Status:** Aktualny (2026-11-15) · **Historia:** M4, M5, M7 · **ADR-y:** [0006](../adr/0006-serwer-zrodlem-prawdy.md), [0007](../adr/0007-websocket-ws-i-protokol-json.md)

## Cel

Przeglądarka i serwer rozmawiają przez jedno połączenie WebSocket typowanym protokołem JSON. Klient przewiduje stan tym samym `game-core` co serwer, więc gra (solo i mecz) jest płynna mimo opóźnień, a zerwane połączenie wraca samo.

## Wymagania

| #   | Wymaganie                                                                                                                                                                                                                          |
| --- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| R1  | Typowany protokół współdzielony przez `web` i `server` (`packages/protocol`) z wersją w `hello`; serwer waliduje każdą wiadomość i odrzuca błędne, za duże lub zbyt częste.                                                        |
| R2  | Serwer symuluje grę za swoim zegarem o bufor wejścia: akcja z ticka z przeszłości trafia na bieżący tick, akcja wyprzedzająca zegar o ponad 1 s jest odrzucana.                                                                    |
| R3  | Klient przewiduje stan lokalnie i uzgadnia go ze snapshotami serwera: przy stałym opóźnieniu (niezależnie od RTT) gra wygląda jak lokalna, a korekta następuje tylko, gdy opóźnienie wiadomości skoczy o więcej niż bufor wejścia. |
| R4  | Zerwane połączenie: klient łączy się ponownie z backoffem i wznawia sesję tokenem z `welcome`; po wygaśnięciu sesji zaczyna od nowa; po przejęciu sesji przez inną kartę nie ponawia.                                              |
| R5  | Limity i bezpieczeństwo: `Origin` równy hostowi gry, rozmiar i częstość wiadomości, sesje łącznie, połączenia na IP, heartbeat.                                                                                                    |

## Scenariusze akceptacyjne

| #   | Given                                | When                                                                                                                               | Then                                                                                                                                                                                   |
| --- | ------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| S1  | Gra w toku, sieć symulowana w teście | Gracz przesuwa, obraca i zrzuca klocki przy stałym RTT 100 ms i 300 ms / gdy jedna wiadomość spóźni się o 300 ms więcej niż reszta | Przy stałym RTT brak korekt; przy skoku opóźnienia korekta następuje, a stan klienta na końcu równa się stanowi serwera                                                                |
| S2  | Klient oszukuje                      | Wysyła akcję z tickiem z przeszłości lub z przyszłości, niepoprawny JSON, wiadomość > 1 KB albo > 90 wiadomości/s                  | Akcja z przeszłości trafia na bieżący tick serwera, z przyszłości jest odrzucana; błędne wiadomości dostają `error`, 3 z rzędu zamykają połączenie; wiadomość > 1 KB zamyka je od razu |
| S3  | Gra w toku                           | Połączenie zrywa się i wraca w TTL sesji / po TTL                                                                                  | Klient łączy się ponownie z rosnącymi odstępami i wznawia tę samą sesję / dostaje `session_expired` i zaczyna nową                                                                     |
| S4  | Strona z obcego `Origin`             | Otwiera WebSocket do `/ws`                                                                                                         | Połączenie jest odrzucone                                                                                                                                                              |

## Design

```
packages/protocol/src/   # typy wiadomości, PROTOCOL_VERSION, parseClientMessage / parseServerMessage (bez zależności)
apps/server/src/ws/      # endpoint /ws na serwerze Express: upgrade, Origin, cookie, limity, heartbeat
apps/server/src/game/    # BufferedClock, BufferedGame: zegar i bufor wejścia (wspólne dla solo i meczu)
apps/web/src/core/net/   # Connection (reconnect z backoffem), etykiety stanu i błędów
apps/web/src/core/play/predictor.ts   # przewidywanie i uzgadnianie
```

Protokół (JSON, pole `type`, `PROTOCOL_VERSION = 2`):

| Kierunek | Wiadomość                                                                                                                      | Opis                                                                                          |
| -------- | ------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------- |
| C → S    | `hello {protocol, resume?: {sessionId, token}}`                                                                                | Nowa sesja lub wznowienie                                                                     |
| C → S    | `input {seq, tick, actions}`                                                                                                   | Akcje z jednego ticka (solo i mecz)                                                           |
| C → S    | `newGame`, `pause {tick}`, `resume`                                                                                            | [Solo](solo.md); w pokoju niedozwolone                                                        |
| C → S    | `watchRooms`/`unwatchRooms`, `createRoom {visibility}`, `joinRoom {code}`, `leaveRoom`, `ready`                                | [1v1](versus-1v1.md)                                                                          |
| S → C    | `welcome {sessionId, token}`, `error {code}`                                                                                   | Sesja; kody: `invalid`, `rate_limited`, `session_expired`, `server_full`, `version`, `origin` |
| S → C    | `game {tick, state, paused}`, `snapshot {tick, ackSeq, state}`, `over {score, lines, level}`                                   | Solo                                                                                          |
| S → C    | `rooms {list}`, `room {code, visibility, players, state, startsAt?}`, `match`, `matchSnapshot`, `result {won, winner, reason}` | 1v1                                                                                           |

| Obszar         | Decyzja                                                                                                                                                                                                                                                                                                                             |
| -------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Transport      | Biblioteka `ws` na tym samym porcie co Express, ścieżka `/ws` (ADR-0007); Traefik przepuszcza WebSocket bez zmian w ingressie                                                                                                                                                                                                       |
| Zegar i bufor  | Klient rusza zegar w chwili wysłania `resume`, serwer w chwili odebrania, więc zegary różnią się o opóźnienie w jedną stronę. Bufor `INPUT_BUFFER_MS` (Helm values), domyślnie 150 ms (9 ticków), do rewizji na podstawie metryk. Akcja z tickiem `t` trafia na `max(t, następny symulowany tick)`; `t` > zegar + 60 jest odrzucane |
| Snapshoty      | Pełny `GameState` co 6 ticków (10/s, ok. 2 KB) z `ackSeq`; klient porównuje go ze swoją historią dla tego ticka i przy różnicy przyjmuje snapshot i odtwarza niepotwierdzone akcje                                                                                                                                                  |
| Reconnect      | Backoff 0,5 → 1 → 2 → 4 → 8 s (dalej co 8 s) z jitterem ±20%; status połączenia w HUD. Wznowienie wymaga `sessionId` i losowego `token` (128 bit); TTL sesji 60 s                                                                                                                                                                   |
| Limity         | `maxPayload` 1 KB; 90 wiadomości/s (token bucket, zapas 120; klient wysyła najwyżej 1 `input` na tick); 3 błędy z rzędu zamykają połączenie; ping co 15 s, brak pong → zamknięcie. Limit połączeń na IP (`MAX_CONNECTIONS_PER_IP`) jest w kodzie, ale na AWS wyłączony (`0`), bo Traefik widzi klientów pod `10.42.0.1`             |
| Bezpieczeństwo | `Origin` musi być równy `ALLOWED_ORIGIN` (Helm values); przy upgrade serwer czyta cookie sesji ([konta](konta.md) R4). Seed znany klientowi to akceptowane ryzyko (ADR-0006)                                                                                                                                                        |

Poza zakresem: binarny format protokołu, delty stanu, wiele replik serwera (sesje w pamięci wymagają 1 repliki), limit na IP przed zmianą `externalTrafficPolicy` na `Local`.
