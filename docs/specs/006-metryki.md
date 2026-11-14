# Spec 006 · Metryki, logi i alerty

- **Milestone:** M6 · **Status:** Approved (2026-11-14) · **ADR-y:** [0005](../adr/0005-deploy-przez-ssm-i-helm.md), [0009](../adr/0009-monitoring-w-klastrze.md)

## Cel

Widzimy stan bety i produ na jednym dashboardzie Grafany: ruch, gry, czas ticka, błędy, zasoby, bazę i backup. Serwer pisze logi JSON, a problemy (awaria, błędy 5xx, wolny tick, brak backupu, koniec miejsca) pokazują się jako alerty w Grafanie. Na tej podstawie stroimy battle royale w M7 i bufor wejścia (ADR-0006).

## Wymagania

| #   | Wymaganie                                                                                                                                                                                                                                                                                  |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| R1  | Serwer wystawia metryki Prometheusa (`prom-client`) na osobnym porcie, niedostępnym przez ingress: domyślne metryki Node.js, HTTP (liczba i czas żądań), WebSocket (połączenia, odrzucone wiadomości), gra (aktywne sesje, czas ticka, gry rozpoczęte i zakończone), logowania, pool `pg`. |
| R2  | Serwer pisze logi jako JSON, jedna linia na zdarzenie, z `level`, `msg`, `env`, `version`; log dostępu HTTP bez cookie, haseł i tokenów. Logi czytamy przez `kubectl logs`.                                                                                                                |
| R3  | `kube-prometheus-stack` w namespace `monitoring`: Prometheus (retencja 15 dni), Grafana, kube-state-metrics, node-exporter; bez Alertmanagera. Prometheus zbiera metryki aplikacji z bety i produ oraz Traefika. Serwer to t4g.medium (ADR-0009).                                          |
| R4  | Grafana pod `https://grafana.<IP>.sslip.io` (TLS z Let's Encrypt), logowanie kontem admina z hasłem w Secrecie, bez dostępu anonimowego. Dashboard jako kod w repo, ze zmienną `env` (beta/prod).                                                                                          |
| R5  | Alerty jako kod (`PrometheusRule`), widoczne w Grafanie i na dashboardzie, bez powiadomień: aplikacja niedostępna, odsetek 5xx, wolny tick, restarty i pamięć podów, miejsce na dysku, brak udanego backupu.                                                                               |

## Scenariusze akceptacyjne

| #   | Given                                  | When                                                                 | Then                                                                                                                                                           |
| --- | -------------------------------------- | -------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| S1  | Działający serwer                      | Gracz gra jedną grę / ktoś pobiera `https://<host>/metrics`          | Liczniki gier, ticków i żądań rosną w `/metrics` na porcie metryk; z internetu `/metrics` zwraca stronę gry (SPA) albo 404, nigdy metryki                      |
| S2  | Zalogowany gracz                       | Loguje się, gra i wywołuje błąd 500                                  | Każde zdarzenie to jedna linia JSON z `level`, `msg`, `env`, `version`; w logach nie ma wartości cookie `sid` ani hasła                                        |
| S3  | Beta i prod po deployu M6              | Admin otwiera dashboard i przełącza `env`                            | Panele ruchu, gier, ticka, błędów, pamięci, bazy i backupu pokazują dane wybranego środowiska z ostatnich 15 dni                                               |
| S4  | Niezalogowany użytkownik / pod Grafany | Otwiera `grafana.<IP>.sslip.io` / wysyła żądanie do IMDS             | Widzi tylko ekran logowania (TLS ważny) / połączenie z IMDS jest zablokowane przez NetworkPolicy                                                               |
| S5  | Beta z działającym monitoringiem       | Skalujemy deployment bety do 0 na 3 min / zawieszamy CronJob backupu | Alert „aplikacja niedostępna” dla `env=beta` jest aktywny w Grafanie i znika po przywróceniu; brak backupu > 26 h daje alert (test regułą z obniżonym progiem) |

## Design

```
apps/server/src/observability/   # logger (pino), rejestr prom-client, metryki HTTP/WS/gry/pg, serwer metryk (port 9464)
deploy/helm/tetris/templates/     # podmonitor.yaml (gdy jest CRD), port `metrics` w deploymencie, NetworkPolicy z `monitoring`
deploy/helm/monitoring/           # chart-nakładka: zależność kube-prometheus-stack, values, ingress Grafany, Secret,
  dashboards/blockfall.json       #   dashboard jako ConfigMap (sidecar Grafany), PrometheusRule z alertami,
  templates/                      #   NetworkPolicy block-imds dla namespace'u monitoring
deploy/scripts/monitoring-deploy.sh  # helm upgrade --install przez SSM (jak node-deploy.sh)
infra/terraform/main/variables.tf    # instance_type = t4g.medium
```

| Obszar         | Decyzja                                                                                                                                                                                                                                                                           |
| -------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Pojemność      | t4g.medium (4 GB): na t4g.small zostaje ~640 MB wolnej pamięci, a stack potrzebuje ~600–900 MB. Koszt ok. +12 USD/mies. Zmiana typu to stop/start instancji z tym samym dyskiem i Elastic IP (ADR-0009)                                                                           |
| Endpoint       | Osobny serwer HTTP na porcie 9464 tylko z `/metrics`; Service i ingress aplikacji go nie wystawiają. Nie wspólny Express: łatwo przypadkiem wystawić metryki przez ingress                                                                                                        |
| Metryki        | Prefiks `blockfall_`; etykiety o małej liczności (`route` z wzorca Express, nie z URL; `status` jako klasa `2xx`…`5xx`); bez `userId` i loginów w etykietach. Czas ticka jako histogram z kubełkami wokół budżetu 16,7 ms (60 ticków/s)                                           |
| Logi           | `pino` (JSON, szybki, `redact` dla `req.headers.cookie`, `password`); poziom z `LOG_LEVEL`. Bez Loki: kolejny komponent w pamięci, a przy obecnym ruchu wystarczy `kubectl logs`                                                                                                  |
| Zbieranie      | `PodMonitor` w chartcie `tetris`, tworzony tylko gdy klaster ma CRD (`.Capabilities.APIVersions.Has`), więc deploy aplikacji nie zależy od monitoringu. Interwał 30 s. Etykieta `env` z namespace'u                                                                               |
| Stack          | `kube-prometheus-stack` z Alertmanagerem wyłączonym i bez domyślnych reguł (dużo szumu na jednym węźle); retencja 15 dni lub 5 GB na PVC `local-path`; limity pamięci: Prometheus 768 Mi, Grafana 256 Mi                                                                          |
| Grafana        | Hasło admina w Secrecie generowanym przez Helm (`lookup`, stałe między deployami), odczyt według runbooka. Ingress przez Traefika z `letsencrypt`. Dashboard i źródło danych z provisioningu; edycja w UI nie jest trwała, zmiany idą przez PR                                    |
| Alerty         | `PrometheusRule` w chartcie `monitoring`, Grafana pokazuje je z Prometheusa (lista alertów i panel na dashboardzie). Progi: `up == 0` 2 min; 5xx > 5% przez 5 min; p99 ticka > 8 ms przez 5 min; > 3 restarty w 1 h; pamięć > 90% limitu; dysk > 80%; brak udanego backupu > 26 h |
| Bezpieczeństwo | Grafana jest publiczna, więc NetworkPolicy odcina IMDS w `monitoring`; ruch do portu metryk aplikacji tylko z namespace'u `monitoring`                                                                                                                                            |
| Deploy         | Chart `monitoring` pakowany i wysyłany do ECR w CI jak `tetris`; workflow `Monitoring` (push do `main` w `deploy/helm/monitoring/**` i ręcznie) instaluje go przez SSM (ADR-0005)                                                                                                 |

Poza zakresem: powiadomienia (e-mail, Discord, Slack), Loki i agregacja logów, tracing, metryki Postgresa z `postgres_exporter`, SLO i budżety błędów, metryki z przeglądarki (RUM).

## Zadania

| #   | Zadanie                                                                                                                                        | Pokrywa | Status |
| --- | ---------------------------------------------------------------------------------------------------------------------------------------------- | ------- | ------ |
| T1  | Logi JSON: `pino`, zamiana `console.*`, log dostępu HTTP z `redact`; testy redakcji                                                            | R2, S2  | ☑      |
| T2  | Metryki w serwerze: rejestr, serwer metryk na 9464, metryki HTTP, WS, gry, logowań i `pg`; testy liczników                                     | R1, S1  | ☐      |
| T3  | Infra: t4g.medium w OpenTofu (stop/start według runbooka); w chartcie `tetris` port `metrics`, `PodMonitor`, NetworkPolicy                     | R1, R3  | ☐      |
| T4  | Chart `monitoring`: kube-prometheus-stack, Grafana z ingressem i Secretem, block-imds, `PrometheusRule`, dashboard; CI i workflow `Monitoring` | R3–R5   | ☐      |
| T5  | Weryfikacja na AWS (S1–S5), runbook monitoringu (logowanie do Grafany, czytanie logów, alerty), roadmapa                                       | S1–S5   | ☐      |
