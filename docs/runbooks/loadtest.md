# Runbook: test obciążeniowy 1v1 (k6)

Sprawdza, czy serwer utrzyma równoległe mecze 1v1 bez spowolnienia pętli gry ([spec 007](../specs/007-1v1.md), S6). Scenariusz: [`loadtest/1v1.js`](../../loadtest/1v1.js). Każdy bot łączy się po WebSockecie, dołącza do pokoju publicznego z listy albo zakłada własny, zgłasza gotowość i gra losowymi ruchami. Na jednym połączeniu rozgrywa 3 mecze (ok. 12 s każdy), potem łączy się od nowa.

## Kiedy i gdzie

- **Beta**, przed wydaniem i po zmianach w pętli gry, pokojach lub protokole. Kryterium: 64 boty (32 mecze naraz) przez 5 min.
- **Nie na prodzie**: boty zajmują sloty sesji i pokoi (`MAX_SESSIONS`, `MAX_ROOMS`) i zapisują mecze gości w tabeli `matches`.
- Test idzie z laptopa przez internet, więc obciąża też Traefika i łącze serwera, tak jak prawdziwi gracze.

## Uruchomienie

k6 lokalnie (`brew install k6`) albo z obrazu Dockera, bez instalacji:

```sh
IP=$(cd infra/terraform/main && tofu output -raw public_ip)
docker run --rm -i -e BASE_URL="https://beta.$IP.sslip.io" grafana/k6:1.0.0 run - < loadtest/1v1.js
```

Zmienne: `VUS` (boty, domyślnie 64), `DURATION` (5m), `MATCHES` (meczów na połączenie, 3). Gdy beta jest za basic auth (`BASIC_AUTH=true` w środowisku GitHub `beta`), dodaj `-e BASIC_AUTH='login:hasło'`; hasło nie trafia do repo.

Lokalnie (serwer z `yarn workspace @tetris/server dev` i Postgresem w Dockerze): `-e BASE_URL=http://host.docker.internal:3000`.

## Co sprawdzić

W k6 (podsumowanie po teście):

| Metryka                         | Oczekiwane                                                                             |
| ------------------------------- | -------------------------------------------------------------------------------------- |
| `checks`                        | > 95% (próg testu): połączenie 101, każdy bot kończy mecz, wynik ma zwycięzcę          |
| `matches_finished`              | Rośnie przez cały test; ok. 2 mecze/s przy 64 botach (każdy mecz liczą obaj gracze)    |
| `room_errors{code:room_full}`   | Dopuszczalne: dwa boty naraz dołączają do tego samego pokoju, przegrany zakłada własny |
| `room_errors{code:server_full}` | 0; więcej oznacza limit `MAX_SESSIONS` lub `MAX_ROOMS` za niski dla testu              |

W Grafanie (dashboard **Blockfall**, `Środowisko = beta`, ostatnie 15 min):

| Panel                                 | Oczekiwane (kryterium S6)                             |
| ------------------------------------- | ----------------------------------------------------- |
| Pokoje 1v1 → Pokoje według stanu      | ok. 30 pokoi w stanie `playing`                       |
| Przegląd → Tick p99                   | < 8 ms (próg alertu `BlockfallSlowTick`); bez alertu  |
| Gra → Pętla zdarzeń Node.js           | Brak pominiętych ticków (`ticks_dropped`)             |
| Pokoje 1v1 → Czas pętli pokoi         | p99 wyraźnie poniżej całego ticka                     |
| Zasoby i baza → Pamięć podów          | Pod aplikacji < 80% limitu (192 Mi)                   |
| Pokoje 1v1 → Ruch WebSocket z serwera | Głównie `matchSnapshot`; do porównania między testami |

Wynik testu (data, wersja, liczby z tabel) zapisz w opisie PR-a lub w specu milestone'u.

Punkt odniesienia na becie (2026-11-14, wersja `2128bbc`, t4g.medium, 64 boty przez 5 min): 31 pokoi naraz, 642 mecze, 100% sprawdzeń k6, tick p99 2,0 ms (p50 0,37 ms), 0 pominiętych ticków, pod aplikacji 36% limitu pamięci i 0,08 CPU, ruch WebSocket z serwera ok. 0,9 MB/s (prawie w całości `matchSnapshot`).

Lokalnie (laptop, serwer w trybie dev, 64 boty przez 3 min): 32 pokoje naraz, 406 meczów, 99,98% obiegów pętli < 8 ms (p99 ok. 2–4 ms), 0 pominiętych ticków, ok. 43 MB RSS. Boty grają losowo i prawie nie czyszczą linii, więc test nie obciąża ścieżki śmieci.

## Sprzątanie

Mecze botów to wiersze gości w tabeli `matches` bety (`winner_id` i `loser_id` puste). Nie przeszkadzają; w razie potrzeby usuń je według [runbooka deployu](deploy.md#6-baza-danych-i-konta-m5) zapytaniem `delete from matches where winner_id is null and loser_id is null and ended_at between '<start>' and '<koniec>'`.
