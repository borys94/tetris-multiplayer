# Spec 003 · Deploy na AWS (beta i prod)

- **Milestone:** M3 · **Status:** Approved (2026-11-14) · **ADR-y:** [0001](../adr/0001-k3s-na-ec2.md), [0002](../adr/0002-jeden-klaster-beta-prod.md), [0003](../adr/0003-publiczne-wydanie-tylko-z-serwerem.md), [0005](../adr/0005-deploy-przez-ssm-i-helm.md)

## Cel

Singleplayer z M2 działa na AWS w dwóch środowiskach, beta i prod, za zamkniętym dostępem. Każdy merge do `main` trafia automatycznie na betę, a ten sam obraz po akceptacji na prod.

## Wymagania

| #   | Wymaganie                                                                                                                                                                                                                                                       |
| --- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| R1  | Terraform tworzy całą infrastrukturę w eu-central-1: sieć, serwer EC2 z k3s, Elastic IP, ECR i role IAM. Brak otwartego SSH i API Kubernetesa; dostęp administracyjny przez SSM. Infrastrukturę da się na żądanie zatrzymać lub usunąć, żeby ograniczyć koszty. |
| R2  | Jeden obraz Dockera (arm64): Express serwuje zbudowany frontend i `/health` z wersją (SHA commita).                                                                                                                                                             |
| R3  | Helm chart wdraża aplikację do namespace'ów `tetris-beta` i `tetris-prod` z limitami zasobów, NetworkPolicy, ingressem Traefika i certyfikatem TLS z Let's Encrypt.                                                                                             |
| R4  | Merge do `main` buduje obraz i wdraża go na betę; prod wdrażamy ręcznie, po akceptacji, tym samym obrazem.                                                                                                                                                      |
| R5  | Oba środowiska są za basic auth (ADR-0003).                                                                                                                                                                                                                     |

## Scenariusze akceptacyjne

| #   | Given                                        | When                                              | Then                                                                                                                                |
| --- | -------------------------------------------- | ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| S1  | Konto AWS bez infrastruktury projektu        | `terraform apply` według runbooka                 | Serwer z k3s działa, węzeł jest `Ready` (sprawdzone przez SSM)                                                                      |
| S2  | Zmergowany PR do `main`                      | Workflow deployu się kończy                       | `https://beta.<IP>.sslip.io/health` zwraca SHA tego commita                                                                         |
| S3  | Wersja działająca na becie                   | Ręczne uruchomienie deployu prod i akceptacja     | Prod zwraca w `/health` ten sam SHA co beta                                                                                         |
| S4  | Otwarta strona bety lub produ                | Wejście bez hasła / z hasłem                      | Bez hasła 401; z hasłem gra działa przez HTTPS z ważnym certyfikatem                                                                |
| S5  | Wersja, która nie przechodzi readiness probe | Deploy                                            | Helm cofa zmianę, poprzednia wersja działa dalej, job w CI jest czerwony                                                            |
| S6  | Działające środowiska                        | Zatrzymanie serwera, a potem ponowne uruchomienie | Po zatrzymaniu koszt spada do ok. 5 USD/mies.; po uruchomieniu beta i prod działają pod tymi samymi adresami, bez ponownego deployu |

## Design

```
infra/terraform/bootstrap/  # raz: bucket na stan Terraform, ECR, rola OIDC dla GitHub Actions
infra/terraform/main/       # VPC, EC2 t4g.small, Elastic IP, security group, rola instancji, cloud-init
deploy/helm/tetris/         # chart + values-beta.yaml, values-prod.yaml
apps/server/Dockerfile      # multi-stage: build web (Vite) + bundle server (esbuild) → node:26-slim
.github/workflows/deploy.yml
docs/runbooks/deploy.md
```

| Obszar                  | Decyzja                                                                                                                                                                                                                                                                                                                                                                                                                     |
| ----------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Serwer                  | EC2 t4g.small (arm64, 2 GB RAM), dysk 20 GB gp3, Elastic IP; security group: tylko 80 i 443                                                                                                                                                                                                                                                                                                                                 |
| Narzędzie IaC           | OpenTofu (otwarta licencja, zgodny z kodem Terraform); katalog `infra/terraform`                                                                                                                                                                                                                                                                                                                                            |
| Stan OpenTofu           | Bucket S3 z natywnym lockowaniem (`use_lockfile`); bucket tworzony raz przez AWS CLI (runbook)                                                                                                                                                                                                                                                                                                                              |
| Kto uruchamia Terraform | Ręcznie, lokalnie (zmiany infrastruktury są rzadkie); w CI tylko deploy aplikacji                                                                                                                                                                                                                                                                                                                                           |
| Bootstrap k3s           | cloud-init: k3s (z Traefikiem), helm, `ecr-credential-provider` (pull z ECR przez rolę instancji), `HelmChartConfig` Traefika z resolverem ACME                                                                                                                                                                                                                                                                             |
| Obraz                   | Jeden obraz `tetris-app`; Express serwuje `apps/web/dist` i `/health`; `game-core` wbudowany w bundle serwera (esbuild); budowany na runnerze `ubuntu-24.04-arm`                                                                                                                                                                                                                                                            |
| Domena                  | Na razie bez domeny: `beta.<IP>.sslip.io` i `<IP>.sslip.io` (sslip.io jest na Public Suffix List, więc limity Let's Encrypt nie są współdzielone)                                                                                                                                                                                                                                                                           |
| TLS                     | Wbudowany ACME w Traefiku (Let's Encrypt, HTTP-01), certyfikaty w `acme.json` na dysku serwera; bez cert-managera, żeby oszczędzić RAM. Przy wielu węzłach lub EKS wracamy do cert-managera                                                                                                                                                                                                                                 |
| Chart                   | Deployment (1 replika, probes na `/health`), Service, Ingress, Middleware basic auth, ResourceQuota, NetworkPolicy                                                                                                                                                                                                                                                                                                          |
| Basic auth              | Secret `basic-auth` w każdym namespace, tworzony ręcznie przez SSM (runbook); hasło poza repo                                                                                                                                                                                                                                                                                                                               |
| CD                      | `deploy.yml`: push do `main` → build i push obrazu oraz chartu do ECR → SSM `helm upgrade --install --atomic` w `tetris-beta`. Prod: `workflow_dispatch` z SHA, GitHub Environment `production` z wymaganą akceptacją                                                                                                                                                                                                       |
| Koszt                   | Ok. 18 USD/mies. (EC2 ~12, publiczny IPv4 ~3,6, EBS ~1,6, ECR < 1)                                                                                                                                                                                                                                                                                                                                                          |
| Wycofanie na żądanie    | 1) **Stop/start:** workflow `infra-power.yml` (`workflow_dispatch`: `stop`/`start`) i skrypt lokalny; zatrzymuje EC2, zostaje dysk i Elastic IP (ok. 5 USD/mies.), powrót w ok. 2 min z tym samym IP, certyfikatami i wdrożoną wersją. 2) **Pełne usunięcie:** `terraform destroy` w `main` (zostaje bootstrap: stan, ECR, OIDC; koszt < 1 USD/mies.); powrót to `terraform apply` + deploy, nowe IP i nowe adresy sslip.io |

Poza zakresem: własna domena (przed M4), Terraform w CI, backupy (aplikacja jest bezstanowa do M5), metryki i logi (M6), HA i autoskalowanie.

## Zadania

| #   | Zadanie                                                                                                      | Pokrywa                | Status |
| --- | ------------------------------------------------------------------------------------------------------------ | ---------------------- | ------ |
| T1  | Dockerfile, bundling serwera z `game-core`, serwowanie frontendu, `/health` z wersją                         | R2                     | ☑      |
| T2  | Terraform: bootstrap (stan, ECR, OIDC) i main (sieć, EC2, IAM, cloud-init z k3s)                             | R1, S1                 | ☐      |
| T3  | Helm chart z values dla bety i produ, ingress z resolverem ACME, basic auth, quota, NetworkPolicy            | R3, R5, S4             | ☐      |
| T4  | Workflowy `deploy.yml` (beta automatycznie, prod po akceptacji, OIDC + SSM) i `infra-power.yml` (stop/start) | R1, R4, S2, S3, S5, S6 | ☐      |
| T5  | Runbook: pierwsze uruchomienie, hasło basic auth, rollback, stop/start, pełne usunięcie i odtworzenie        | R1, R5, S6             | ☐      |
