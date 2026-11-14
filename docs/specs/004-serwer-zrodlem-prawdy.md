# Spec 004 · Serwer jako źródło prawdy

- **Milestone:** M4 · **Status:** Approved (2026-11-14) · **ADR-y:** [0003](../adr/0003-publiczne-wydanie-tylko-z-serwerem.md), [0004](../adr/0004-deterministyczny-silnik-gry.md), [0006](../adr/0006-serwer-zrodlem-prawdy.md), [0007](../adr/0007-websocket-ws-i-protokol-json.md)

## Cel

Singleplayer liczy serwer: przeglądarka wysyła tylko akcje gracza, a stan i wynik gry pochodzą z `game-core` uruchomionego na serwerze. Gra jest płynna mimo opóźnień sieci, przeżywa zerwanie połączenia i jako **Blockfall** zostaje publicznie udostępniona na prod (v0.3).

## Wymagania

| #   | Wymaganie                                                                                                                                                                                                                                                                                |
| --- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| R1  | Serwer prowadzi sesję gry: losuje seed, liczy ticki we własnym zegarze, stosuje akcje klienta w `game-core` i rozstrzyga game over i wynik. Klient nie wysyła stanu ani wyniku, tylko akcje.                                                                                             |
| R2  | Typowany protokół WebSocket współdzielony przez `web` i `server` (`packages/protocol`); serwer waliduje każdą wiadomość i odrzuca błędne, za duże lub zbyt częste.                                                                                                                       |
| R3  | Klient przewiduje stan lokalnie tym samym `game-core` i uzgadnia go ze snapshotami serwera, więc przy stałym opóźnieniu sieci (niezależnie od RTT) gra wygląda jak lokalna, a korekta pozycji klocka następuje tylko wtedy, gdy opóźnienie wiadomości skoczy o więcej niż bufor wejścia. |
| R4  | Zerwane połączenie wstrzymuje sesję; klient łączy się ponownie z backoffem i wznawia tę samą grę w ciągu 60 s. Po tym czasie serwer usuwa sesję.                                                                                                                                         |
| R5  | Gra nazywa się **Blockfall** we wszystkim, co widzi gracz; prod jest publiczny (bez basic auth), beta zostaje zamknięta (ADR-0003). Serwer ma limity: połączeń na IP, sesji łącznie, rozmiaru i częstości wiadomości oraz sprawdza `Origin`.                                             |

## Scenariusze akceptacyjne

| #   | Given                                | When                                                                                                                               | Then                                                                                                                                                                                   |
| --- | ------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| S1  | Nowa sesja z seedem od serwera       | Klient wysyła sekwencję akcji, a gra trwa do game over                                                                             | Wynik pokazany graczowi pochodzi z wiadomości serwera i równa się wynikowi odtworzonemu z seeda i logu akcji                                                                           |
| S2  | Gra w toku, sieć symulowana w teście | Gracz przesuwa, obraca i zrzuca klocki przy stałym RTT 100 ms i 300 ms / gdy jedna wiadomość spóźni się o 300 ms więcej niż reszta | Przy stałym RTT brak korekt (snapshoty zgadzają się z przewidywaniem); przy skoku opóźnienia korekta następuje, a stan klienta na końcu równa się stanowi serwera                      |
| S3  | Klient oszukuje                      | Wysyła akcję z tickiem z przeszłości lub z przyszłości, niepoprawny JSON, wiadomość > 1 KB albo > 90 wiadomości/s                  | Akcja z przeszłości trafia na bieżący tick serwera, z przyszłości jest odrzucana; błędne wiadomości dostają `error`, 3 z rzędu zamykają połączenie; wiadomość > 1 KB zamyka je od razu |
| S4  | Gra w toku                           | Połączenie zrywa się na 10 s, potem wraca / nie wraca przez 60 s                                                                   | Po powrocie gra jest wstrzymana w tym samym stanie i da się ją wznowić; po 60 s sesja znika, a klient proponuje nową grę                                                               |
| S5  | Wersja wdrożona na betę i prod       | Wejście na `https://<IP>.sslip.io` i `https://beta.<IP>.sslip.io` bez hasła                                                        | Prod: Blockfall działa przez `wss://` bez hasła; beta: 401                                                                                                                             |

## Design

```
packages/protocol/src/   # typy wiadomości, PROTOCOL_VERSION, parseClientMessage / parseServerMessage (bez zależności)
apps/server/src/game/    # Session (zegar, bufor wejścia, pauza, snapshoty), SessionStore (TTL, limity)
apps/server/src/ws.ts    # endpoint /ws na serwerze Express: upgrade, Origin, limity, heartbeat
apps/web/src/net/        # Connection (reconnect z backoffem), Predictor (przewidywanie + uzgadnianie)
```

Protokół (JSON, pole `type`, wersja w `hello`):

```ts
type ClientMessage =
  | { type: "hello"; protocol: 1; resume?: { sessionId: string; token: string } }
  | { type: "newGame" } // nowa gra lub restart; serwer odpowiada `game`
  | { type: "input"; seq: number; tick: number; actions: Action[] } // akcje z jednego ticka
  | { type: "pause"; tick: number }
  | { type: "resume" };

type ServerMessage =
  | { type: "welcome"; sessionId: string; token: string }
  | { type: "game"; tick: number; state: GameState; paused: boolean } // start gry, wznowienie sesji
  | { type: "snapshot"; tick: number; ackSeq: number; state: GameState }
  | { type: "over"; score: number; lines: number; level: number }
  | {
      type: "error";
      code: "invalid" | "rate_limited" | "session_expired" | "server_full" | "version" | "origin";
    };
```

| Obszar              | Decyzja                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Model               | Serwer autorytatywny z przewidywaniem po stronie klienta (ADR-0006); jeden proces, sesje w pamięci (przed M5 nic nie zapisujemy)                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| Zegar i bufor       | Klient rusza swój zegar w chwili wysłania `resume`, serwer w chwili jego odebrania, więc zegary różnią się o opóźnienie w jedną stronę, a akcja dociera na serwer mniej więcej na ten sam tick zegara serwera. Symulacja idzie za zegarem o bufor wejścia: parametr `INPUT_BUFFER_MS` (Helm values), domyślnie 150 ms (9 ticków), do rewizji po M6 na podstawie wahań opóźnienia. Akcja z tickiem `t` trafia na `max(t, następny symulowany tick)`; `t` większe od zegara + 60 (1 s) jest odrzucane. Pauza zawiera tick klienta, ograniczony do tego samego zakresu |
| Snapshoty           | Pełny `GameState` co 6 ticków (10/s, ok. 2 KB) z `ackSeq`; klient porównuje go ze swoją historią dla tego ticka i przy różnicy przyjmuje snapshot i odtwarza niepotwierdzone akcje                                                                                                                                                                                                                                                                                                                                                                                  |
| Transport           | Biblioteka `ws` na tym samym porcie co Express, ścieżka `/ws` (ADR-0007); Traefik przepuszcza WebSocket bez zmian w ingressie                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| Pauza i rozłączenie | Pauza zatrzymuje zegar sesji; rozłączenie działa jak pauza. Sesja żyje 60 s bez połączenia; wznowienie wymaga `sessionId` i losowego `token` (128 bit) z `welcome`                                                                                                                                                                                                                                                                                                                                                                                                  |
| Reconnect           | Klient: backoff 0,5 → 1 → 2 → 4 → 8 s (dalej co 8 s) z jitterem ±20%; po wygaśnięciu sesji nowa gra; status połączenia w HUD; po przejęciu sesji przez inną kartę bez ponawiania                                                                                                                                                                                                                                                                                                                                                                                    |
| Limity              | `maxPayload` 1 KB; 90 wiadomości/s na połączenie (token bucket, zapas 120; klient wysyła najwyżej 1 `input` na tick), 3 błędy z rzędu zamykają połączenie; limit połączeń na IP (`X-Forwarded-For` od Traefika, `MAX_CONNECTIONS_PER_IP`) jest w kodzie, ale na AWS wyłączony (`0`): Traefik w k3s widzi wszystkich klientów pod adresem `10.42.0.1`. Włączymy go po zmianie `externalTrafficPolicy` na `Local` (M6/M7); 200 sesji łącznie; ping co 15 s, brak pong → zamknięcie                                                                                    |
| Bezpieczeństwo      | `Origin` musi być równy hostowi z konfiguracji (`ALLOWED_ORIGIN` z Helm values); seed znany klientowi jest akceptowanym ryzykiem (ADR-0006)                                                                                                                                                                                                                                                                                                                                                                                                                         |
| Nazwa               | Blockfall w tytule strony, nagłówku, README i realm basic auth bety; wewnętrzne nazwy (repo, pakiety `@tetris/*`, chart, namespace'y) zostają                                                                                                                                                                                                                                                                                                                                                                                                                       |
| Otwarcie prod       | `basicAuth.enabled: false` w `values-prod.yaml`; beta bez zmian; runbook z krokiem otwarcia i powrotu do zamkniętego dostępu                                                                                                                                                                                                                                                                                                                                                                                                                                        |

Poza zakresem: konta i zapis wyników (M5), metryki (M6), pokoje i wielu graczy (M7), binarny format protokołu, skalowanie na wiele replik (sesje w pamięci wymagają 1 repliki), własna domena.

## Zadania

| #   | Zadanie                                                                                                                                          | Pokrywa                    | Status |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------- | ------ |
| T1  | `packages/protocol`: typy, walidacja wiadomości, testy                                                                                           | R2, S3                     | ☑      |
| T2  | `server`: `Session` z zegarem i buforem wejścia, `SessionStore` z TTL, endpoint `/ws` z limitami, Origin i heartbeatem; testy z prawdziwym `ws`  | R1, R2, R4, R5, S1, S3, S4 | ☑      |
| T3  | `web`: `Connection` z reconnectem, `Predictor` z uzgadnianiem, `Game` gra przez serwer, status połączenia; testy przewidywania z symulowanym RTT | R3, R4, S1, S2, S4         | ☑      |
| T4  | Zmiana nazwy na Blockfall (UI, `index.html`, README, realm bety)                                                                                 | R5                         | ☑      |
| T5  | Helm: `ALLOWED_ORIGIN`, prod bez basic auth; runbook; roadmapa (M4 ✅, v0.3); weryfikacja S5 na AWS                                              | R5, S5                     | ☑      |
