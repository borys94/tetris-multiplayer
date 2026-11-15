# Infrastruktura i deploy

- **Status:** Aktualny (2026-11-15) · **Historia:** M3, M4, M5, M6, M7 · **ADR-y:** [0001](../adr/0001-k3s-na-ec2.md), [0002](../adr/0002-jeden-klaster-beta-prod.md), [0003](../adr/0003-publiczne-wydanie-tylko-z-serwerem.md), [0005](../adr/0005-deploy-przez-ssm-i-helm.md), [0008](../adr/0008-postgres-w-klastrze.md), [0009](../adr/0009-monitoring-w-klastrze.md)

## Cel

Blockfall działa na AWS w dwóch środowiskach w jednym klastrze k3s: beta (zamknięta) i prod (publiczny). Każdy merge do `main` trafia automatycznie na betę, a ten sam obraz po akceptacji na prod, bez przerywania trwających meczów. Dane są w Postgresie z codziennym backupem.

## Wymagania

| #   | Wymaganie                                                                                                                                                                                                                                             |
| --- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| R1  | OpenTofu tworzy całą infrastrukturę w eu-central-1: sieć, EC2 z k3s, Elastic IP, ECR, bucket backupów i role IAM. Brak otwartego SSH i API Kubernetesa; dostęp administracyjny przez SSM. Serwer da się zatrzymać lub usunąć, żeby ograniczyć koszty. |
| R2  | Jeden obraz Dockera (arm64): Express serwuje zbudowany frontend, `/health` z wersją (SHA commita) i `/ready`.                                                                                                                                         |
| R3  | Helm chart wdraża aplikację do `tetris-beta` i `tetris-prod` z limitami zasobów, NetworkPolicy, ingressem Traefika i TLS z Let's Encrypt. Prod jest publiczny, beta za basic auth (ADR-0003).                                                         |
| R4  | Merge do `main` wdraża obraz na betę; prod ręcznie, po akceptacji, tym samym obrazem. Nieudany deploy cofa się sam, a deploy nie przerywa trwających meczów.                                                                                          |
| R5  | Postgres w klastrze, osobny w becie i prodzie, dane na dysku serwera; migracje przy starcie serwera; codzienny backup do S3 z retencją 30 dni i opisanym odtworzeniem.                                                                                |

## Scenariusze akceptacyjne

| #   | Given                                 | When                                                         | Then                                                                                                                        |
| --- | ------------------------------------- | ------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------- |
| S1  | Konto AWS bez infrastruktury projektu | `tofu apply` według runbooka                                 | Serwer z k3s działa, węzeł jest `Ready` (sprawdzone przez SSM)                                                              |
| S2  | Zmergowany PR / wersja bez readiness  | Deploy na betę, potem ręcznie na prod / deploy               | Beta, a po akceptacji prod zwracają w `/health` SHA commita / Helm cofa zmianę, poprzednia wersja działa, job jest czerwony |
| S3  | Wersja wdrożona na betę i prod        | Wejście bez hasła na `https://<IP>.sslip.io` i `beta.`       | Prod: gra działa przez HTTPS i `wss://`; beta: 401                                                                          |
| S4  | Trwa mecz 1v1                         | Deploy nowej wersji                                          | Mecz kończy się na starym podzie, nowe pokoje powstają na nowym                                                             |
| S5  | Baza z kontami i wynikami             | Restart poda Postgresa / backup i odtworzenie do pustej bazy | Dane są po restarcie; dump trafia do S3, a po odtworzeniu konta, wyniki i ranking są takie same                             |
| S6  | Działające środowiska                 | Zatrzymanie serwera, potem ponowne uruchomienie              | Po zatrzymaniu koszt spada do ok. 5 USD/mies.; po uruchomieniu beta i prod działają pod tymi samymi adresami                |

> **Odstępstwo od ADR-0003 (S3):** beta jest tymczasowo bez hasła (`BASIC_AUTH=false` w środowisku GitHub `beta`), bo za basic auth przeglądarka nie łączyła się z WebSocketem. Przyczyna do wyjaśnienia.

## Design

```
infra/terraform/bootstrap/   # raz: bucket stanu, ECR, rola OIDC dla GitHub Actions, bucket backupów
infra/terraform/main/        # VPC, EC2 t4g.medium, Elastic IP, security group, rola instancji, cloud-init
deploy/helm/tetris/          # chart + values-beta.yaml, values-prod.yaml; postgres.yaml, backup-cronjob.yaml
deploy/scripts/              # ssm-deploy.sh, node-deploy.sh, ssm-run.sh
apps/server/Dockerfile       # multi-stage: build web (Vite) + bundle server (esbuild) → node:26-slim
.github/workflows/deploy.yml, infra-power.yml
docs/runbooks/deploy.md
```

| Obszar        | Decyzja                                                                                                                                                                                                                               |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Serwer        | EC2 t4g.medium (arm64, 4 GB, ADR-0009), dysk 20 GB gp3, Elastic IP; security group: tylko 80 i 443. Koszt ok. 30 USD/mies.                                                                                                            |
| IaC           | OpenTofu w `infra/terraform`, uruchamiany ręcznie lokalnie (zmiany są rzadkie); stan w S3 z natywnym lockowaniem (`use_lockfile`)                                                                                                     |
| Bootstrap k3s | cloud-init: k3s (z Traefikiem), helm, `ecr-credential-provider` (pull z ECR przez rolę instancji), `HelmChartConfig` Traefika z resolverem ACME                                                                                       |
| Obraz         | Jeden obraz `tetris-app`; `game-core` wbudowany w bundle serwera (esbuild); budowany na runnerze `ubuntu-24.04-arm`                                                                                                                   |
| Domena i TLS  | Bez domeny: `beta.<IP>.sslip.io` i `<IP>.sslip.io`. ACME w Traefiku (HTTP-01), certyfikaty w `acme.json`; bez cert-managera, żeby oszczędzić RAM                                                                                      |
| Chart         | Deployment (1 replika, probes `/health` i `/ready`), Service, Ingress, Middleware basic auth, ResourceQuota (mieści dwa pody), NetworkPolicy (m.in. `block-imds`)                                                                     |
| Basic auth    | Secret `basic-auth` w namespace, tworzony ręcznie przez SSM (runbook); włączany zmienną `BASIC_AUTH` środowiska GitHub                                                                                                                |
| CD            | `deploy.yml`: push do `main` → obraz i chart do ECR → SSM `helm upgrade --install --atomic` w `tetris-beta`. Prod: `workflow_dispatch` z SHA, GitHub Environment `production` z akceptacją                                            |
| Drain         | `maxSurge: 1`, `maxUnavailable: 0`; po `SIGTERM` stary pod przestaje być `ready`, nie tworzy pokoi, rozłącza graczy spoza meczów i czeka do 280 s na koniec meczów (`terminationGracePeriodSeconds: 300`). Gry solo przepadają        |
| Baza          | Postgres 17 jako StatefulSet w każdym namespace, PVC 2 Gi (`local-path`), dostęp tylko z poda aplikacji; hasło w Secrecie generowanym przez Helm (`lookup`). `pg` bez ORM-a, migracje w kodzie pod `pg_advisory_lock`                 |
| Backup        | CronJob 03:00: `pg_dump -Fc` → `s3://<bucket>/<env>/<data>.dump`, lifecycle 30 dni; bucket w `bootstrap` (przeżywa `destroy`). Uprawnienia z roli serwera przez IMDS (2 hopy); `block-imds` odcina IMDS wszystkim podom poza backupem |
| Wycofanie     | Stop/start: `infra-power.yml` i skrypt lokalny; zostaje dysk i Elastic IP, powrót w ok. 2 min. Pełne usunięcie: `tofu destroy` w `main` (zostaje bootstrap); powrót to `apply` + deploy, nowe IP i adresy                             |

Poza zakresem: własna domena, OpenTofu w CI, HA bazy i point-in-time recovery, wiele replik i autoskalowanie, EKS.
