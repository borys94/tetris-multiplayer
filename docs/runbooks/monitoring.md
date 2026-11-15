# Runbook: monitoring

Prometheus, Grafana i alerty dla bety i produ ([spec obserwowalnosc](../specs/obserwowalnosc.md), [ADR-0009](../adr/0009-monitoring-w-klastrze.md)). Komendy na serwerze uruchamiamy przez `deploy/scripts/ssm-run.sh '<komenda>'` (kubectl i helm mają ustawiony `KUBECONFIG`).

## Grafana

- Adres: `https://grafana.<IP>.sslip.io` (IP: `cd infra/terraform/main && tofu output -raw public_ip`).
- Login `admin`, hasło z Secretu (generowane przy pierwszej instalacji, stałe między deployami):

```sh
deploy/scripts/ssm-run.sh 'kubectl -n monitoring get secret grafana-admin -o jsonpath="{.data.admin-password}" | base64 -d; echo'
```

Hasło trafia do historii komend SSM w koncie AWS, ale nie do repo ani logów GitHuba. Zmiana hasła: usuń Secret i uruchom ponownie workflow **Monitoring** (Grafana wczyta nowe hasło po restarcie poda).

- Dashboard **Blockfall**: przełącznik `Środowisko` (beta/prod) u góry. Zmiany w UI nie są trwałe: edytuj `deploy/helm/monitoring/dashboards/blockfall.json` (np. zbuduj panel w UI, skopiuj JSON panelu) i wyślij PR.
- Alerty: **Alerting → Alert rules** (źródło Prometheus) i panel „Aktywne alerty” na dashboardzie. Powiadomień nie ma (ADR-0009): sprawdzaj Grafanę po deployu i co kilka dni.

## Deploy monitoringu

Merge do `main` ze zmianą w `deploy/helm/monitoring/**` uruchamia workflow **Monitoring** (pakowanie chartu do ECR `charts/monitoring` i `helm upgrade --install` przez SSM). Ręcznie: **Actions → Monitoring → Run workflow**. Lokalnie, gdy chart `0.0.0-g<sha>` jest już w ECR: `deploy/scripts/ssm-monitoring-deploy.sh <sha>`.

Metryki aplikacji zbiera `PodMonitor` z chartu `tetris`, tworzony tylko gdy klaster ma CRD monitoringu. Po pierwszej instalacji monitoringu wdroż ponownie betę i prod (**Deploy → Run workflow**), żeby powstały PodMonitory.

## Logi

Serwer pisze jedną linię JSON na zdarzenie (`level`, `msg`, `env`, `version`). Loki nie ma, logi czytamy z poda:

```sh
deploy/scripts/ssm-run.sh 'kubectl -n tetris-prod logs deploy/tetris --since=1h | grep "\"level\":\"error\"" | tail -20'
```

Poziom szczegółowości: zmienna `LOG_LEVEL` (`debug`, `info`, `warn`, `error`; domyślnie `info`).

## Co robić przy alercie

| Alert                                        | Pierwszy krok                                                                                                     |
| -------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| `BlockfallDown`                              | `kubectl -n tetris-<env> get pods` i `describe pod`; logi poprzedniego kontenera: `logs deploy/tetris --previous` |
| `BlockfallMetricsDown`                       | Pod działa, ale Prometheus go nie czyta: sprawdź port `metrics` i NetworkPolicy `tetris-isolation`                |
| `BlockfallHighErrorRate`                     | Logi z `"level":"error"` (wyżej); panel „Czas odpowiedzi API” wskazuje trasę                                      |
| `BlockfallSlowTick`, `BlockfallTicksDropped` | Panel „Pętla zdarzeń”: liczba sesji, CPU poda; przy stałym problemie rozważ limit `game.maxSessions`              |
| `PodRestarting`, `PodMemoryNearLimit`        | `kubectl describe pod` (OOMKilled?); limity w `values.yaml` odpowiedniego chartu                                  |
| `DiskAlmostFull`                             | `df -h /`, `du -sh /var/lib/rancher/k3s/storage/*`; retencja Prometheusa: `retentionSize` w chartcie `monitoring` |
| `BackupMissing`                              | `kubectl -n tetris-<env> get jobs`, logi ostatniego joba backupu ([runbook deploy](deploy.md))                    |
