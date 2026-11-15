# Obserwowalność

- **Status:** Aktualny (2026-11-15) · **Historia:** M6, M7 · **ADR-y:** [0005](../adr/0005-deploy-przez-ssm-i-helm.md), [0009](../adr/0009-monitoring-w-klastrze.md)

## Cel

Widzimy stan bety i produ na jednym dashboardzie Grafany: ruch, gry, pokoje, czas ticka, błędy, zasoby, bazę i backup. Serwer pisze logi JSON, problemy pokazują się jako alerty, a test obciążeniowy mówi, ile meczów utrzyma jeden proces.

## Wymagania

| #   | Wymaganie                                                                                                                                                                                                                            |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| R1  | Serwer wystawia metryki Prometheusa na osobnym porcie, niedostępnym przez ingress: Node.js, HTTP, WebSocket (połączenia, odrzucone wiadomości), gra i pokoje (sesje, pokoje, czas ticka, gry i mecze, śmieci), logowania, pool `pg`. |
| R2  | Logi JSON, jedna linia na zdarzenie, z `level`, `msg`, `env`, `version`; log dostępu HTTP bez cookie, haseł i tokenów. Logi czytamy przez `kubectl logs`.                                                                            |
| R3  | `kube-prometheus-stack` w namespace `monitoring` (Prometheus z retencją 15 dni, Grafana, kube-state-metrics, node-exporter, bez Alertmanagera) zbiera metryki aplikacji z bety i produ oraz Traefika.                                |
| R4  | Grafana pod `https://grafana.<IP>.sslip.io`, logowanie kontem admina, bez dostępu anonimowego. Dashboard jako kod ze zmienną `env`; alerty jako kod (`PrometheusRule`), widoczne w Grafanie, bez powiadomień.                        |
| R5  | Test k6: 32 równoległe mecze 1v1 na becie mieszczą p99 ticka w progu alertu (8 ms).                                                                                                                                                  |

## Scenariusze akceptacyjne

| #   | Given                                  | When                                                                 | Then                                                                                                                                       |
| --- | -------------------------------------- | -------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| S1  | Działający serwer                      | Gracz gra jedną grę / ktoś pobiera `https://<host>/metrics`          | Liczniki gier, ticków i żądań rosną na porcie metryk; z internetu `/metrics` zwraca stronę gry albo 404, nigdy metryki                     |
| S2  | Zalogowany gracz                       | Loguje się, gra i wywołuje błąd 500                                  | Każde zdarzenie to jedna linia JSON z `level`, `msg`, `env`, `version`; w logach nie ma cookie `sid` ani hasła                             |
| S3  | Beta i prod                            | Admin otwiera dashboard i przełącza `env`                            | Panele ruchu, gier, pokoi, ticka, błędów, pamięci, bazy i backupu pokazują dane wybranego środowiska                                       |
| S4  | Niezalogowany użytkownik / pod Grafany | Otwiera `grafana.<IP>.sslip.io` / wysyła żądanie do IMDS             | Widzi tylko ekran logowania (TLS ważny) / połączenie z IMDS jest zablokowane                                                               |
| S5  | Beta z monitoringiem                   | Skalujemy deployment bety do 0 na 3 min / zawieszamy CronJob backupu | Alert „aplikacja niedostępna” dla `env=beta` jest aktywny i znika po przywróceniu; brak backupu > 26 h daje alert (próg obniżony w teście) |
| S6  | Beta, dashboard                        | k6 uruchamia 64 boty w 32 pokojach                                   | Mecze kończą się zwycięzcą, p99 ticka < 8 ms, brak pominiętych ticków, pamięć poda < 80% limitu                                            |

## Design

```
apps/server/src/observability/      # logger (pino), access-log, metryki prom-client, serwer metryk (port 9464)
deploy/helm/tetris/templates/        # podmonitor.yaml (gdy jest CRD), port `metrics`, NetworkPolicy z `monitoring`
deploy/helm/monitoring/              # nakładka na kube-prometheus-stack: values, ingress Grafany, Secret,
  dashboards/blockfall.json          #   dashboard (ConfigMap dla sidecara), PrometheusRule, block-imds
deploy/scripts/monitoring-deploy.sh  # helm upgrade --install przez SSM
loadtest/1v1.js                      # scenariusz k6 (boty po WebSockecie)
docs/runbooks/monitoring.md, loadtest.md
```

| Obszar    | Decyzja                                                                                                                                                                                                                                                                                                                                                                |
| --------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Endpoint  | Osobny serwer HTTP na porcie 9464 tylko z `/metrics`; Service i ingress aplikacji go nie wystawiają, ruch tylko z namespace'u `monitoring`                                                                                                                                                                                                                             |
| Metryki   | Prefiks `blockfall_`; etykiety o małej liczności (`route` z wzorca Express, `status` jako klasa), bez `userId` i loginów. Czas ticka jako histogram wokół budżetu 16,7 ms; dla pokoi `blockfall_rooms{state, visibility}`, `blockfall_room_tick_seconds`, `blockfall_garbage_lines_total`, `blockfall_matches_finished_total{reason}`, `blockfall_ws_sent_bytes_total` |
| Logi      | `pino` z `redact` dla cookie i haseł; poziom z `LOG_LEVEL`. Bez Loki: przy obecnym ruchu wystarczy `kubectl logs`                                                                                                                                                                                                                                                      |
| Zbieranie | `PodMonitor` tworzony tylko, gdy klaster ma CRD, więc deploy aplikacji nie zależy od monitoringu. Interwał 30 s, etykieta `env` z namespace'u                                                                                                                                                                                                                          |
| Stack     | Bez Alertmanagera i domyślnych reguł (szum na jednym węźle); retencja 15 dni lub 5 GB; limity pamięci: Prometheus 768 Mi, Grafana 256 Mi                                                                                                                                                                                                                               |
| Grafana   | Hasło admina w Secrecie generowanym przez Helm (`lookup`); dashboard i źródło danych z provisioningu, zmiany przez PR. Publiczna, więc `block-imds` w `monitoring`                                                                                                                                                                                                     |
| Alerty    | `up == 0` 2 min; 5xx > 5% przez 5 min; p99 ticka > 8 ms przez 5 min; > 3 restarty w 1 h; pamięć > 90% limitu; dysk > 80%; brak udanego backupu > 26 h                                                                                                                                                                                                                  |
| Deploy    | Chart `monitoring` pakowany do ECR w CI; workflow `Monitoring` (push w `deploy/helm/monitoring/**` i ręcznie) instaluje go przez SSM                                                                                                                                                                                                                                   |
| k6        | Bot: `hello` → `createRoom`/`joinRoom` → `ready` → co 200–500 ms `input` z losowym ruchem i `hardDrop`. Uruchamiany z laptopa na betę według runbooka                                                                                                                                                                                                                  |

Poza zakresem: powiadomienia (e-mail, Discord, Slack), Loki, tracing, `postgres_exporter`, SLO, metryki z przeglądarki (RUM).
