# ADR-0005: Wdrażaj na k3s przez AWS SSM i Helm, bez wystawiania API Kubernetesa

- **Status:** Accepted
- **Data:** 2026-11-14
- **Milestone:** M3–M7

## Kontekst

GitHub Actions ma wdrażać nowe wersje na klaster k3s na EC2 ([ADR-0001](0001-k3s-na-ec2.md)), na betę automatycznie i na prod po akceptacji. Runnery GitHuba mają zmienne adresy IP, więc trudno ograniczyć dostęp do API Kubernetesa (port 6443). Serwer ma mało RAM (t4g.small, 2 GB).

## Rozważane opcje

1. **SSM + Helm:** CI wysyła obraz i chart do ECR, a potem przez AWS SSM Run Command uruchamia `helm upgrade` na serwerze.
2. **Argo CD (GitOps):** CI zmienia tag obrazu w repo, Argo CD w klastrze sam synchronizuje stan.
3. **kubectl przez publiczne API:** CI łączy się z portem 6443 przez internet.

## Decyzja

Wybieramy **SSM + Helm**:

- CI uwierzytelnia się w AWS przez OIDC (bez stałych kluczy w sekretach GitHuba);
- obraz aplikacji i chart Helm trafiają do ECR (chart jako artefakt OCI);
- CI wywołuje `aws ssm send-command`, który na serwerze uruchamia `helm upgrade --install --atomic` z konkretną wersją obrazu i chartu;
- port 6443 i SSH (22) są zamknięte; dostęp administracyjny tylko przez SSM Session Manager.

## Konsekwencje

**Pozytywne**

- Brak wystawionego API Kubernetesa i otwartego SSH.
- Brak dodatkowych komponentów w klastrze (Argo CD potrzebuje kilkuset MB RAM).
- `--atomic` cofa nieudany deploy automatycznie.

**Negatywne**

- Stan klastra nie jest opisany w repo (to nie GitOps): ręczne zmiany w klastrze nie zostaną wykryte.
- Wyniki `helm` trzeba odczytać z wyniku komendy SSM, co utrudnia debugowanie w CI.
- Deploy zależy od działania agenta SSM na serwerze.

## Kiedy wrócić do decyzji

- Pojawi się drugi klaster albo więcej usług, a ręczne zmiany w klastrze zaczną powodować rozjazdy (wtedy Argo CD lub Flux).
- Serwer dostanie więcej RAM i GitOps nie będzie problemem zasobowym.
