# ADR-0009: Uruchamiaj monitoring w klastrze na serwerze t4g.medium

- **Status:** Accepted
- **Data:** 2026-11-14
- **Milestone:** M6, M7

## Kontekst

W M6 potrzebujemy metryk, dashboardu i alertów dla bety i produ, a w M7 metryk do strojenia battle royale (16 graczy, testy k6). Cała aplikacja działa na jednym serwerze EC2 t4g.small (2 GB RAM, bez swapa) z k3s ([ADR-0001](0001-k3s-na-ec2.md)). Pomiar z 2026-11-14: ~1,2 GB zajęte, ~640 MB dostępne. Pełny `kube-prometheus-stack` (Prometheus, Grafana, operator, kube-state-metrics, node-exporter) potrzebuje ok. 600–900 MB, a quota bety i produ rezerwuje razem 1,75 Gi limitów pamięci.

## Rozważane opcje

1. **t4g.medium (4 GB) i `kube-prometheus-stack` w klastrze:** standardowy stack, wszystko w AWS, zapas pamięci na M7. Ok. +12 USD/mies.
2. **Odchudzony stack na t4g.small:** Prometheus i Grafana bez operatora, krótka retencja. Bez dopłaty, ale na styk: ryzyko OOM przy M7 i testach obciążeniowych.
3. **Grafana Cloud (darmowy plan) z agentem Alloy:** w klastrze tylko agent (~100 MB). Mało pamięci, ale zewnętrzne konto, limity planu i dane poza AWS.

## Decyzja

Wybieramy **opcję 1**:

- serwer zmienia typ na t4g.medium (ten sam dysk i Elastic IP, krótka przerwa na stop/start);
- `kube-prometheus-stack` w namespace `monitoring`, wspólny dla bety i produ, bez Alertmanagera; alerty widoczne tylko w Grafanie;
- Grafana publicznie pod `grafana.<IP>.sslip.io` za logowaniem, z odciętym IMDS.

## Konsekwencje

**Pozytywne**

- Standardowe narzędzia (CRD `PodMonitor`, `PrometheusRule`, dashboardy jako kod), wiedza przenośna na EKS.
- Zapas pamięci na monitoring, M7 i testy k6; dane metryk zostają w AWS.

**Negatywne**

- Koszt serwera rośnie z ok. 12 do ok. 24 USD/mies.
- Monitoring działa na tym samym serwerze co aplikacja: awaria serwera wyłącza też monitoring, więc nie zobaczymy jej w Grafanie.
- Bez powiadomień alerty widać tylko po wejściu do Grafany.
- Aktualizacje stacku i miejsce na dysku dla Prometheusa utrzymujemy sami.

## Kiedy wrócić do decyzji

- Potrzebujemy powiadomień o awarii całego serwera: zewnętrzny healthcheck (np. Route 53 health check) albo monitoring poza klastrem.
- Metryki pokażą, że t4g.medium nie wystarcza dla M7, albo przejdziemy na EKS ([ADR-0001](0001-k3s-na-ec2.md)).
- Koszt serwera stanie się problemem: opcja 2 albo 3.
