# ADR-0002: Trzymaj betę i prod w jednym klastrze, w osobnych namespace'ach

- **Status:** Accepted
- **Data:** 2026-11-13
- **Milestone:** M3

## Kontekst

Potrzebujemy dwóch środowisk: beta (testy przed wydaniem) i prod. Klaster k3s utrzymujemy sami ([ADR-0001](0001-k3s-na-ec2.md)), więc każdy dodatkowy klaster to dodatkowy koszt i praca.

## Rozważane opcje

1. **Jeden klaster, namespace'y `tetris-beta` i `tetris-prod`.**
2. **Dwa osobne klastry.**

## Decyzja

Na początku wybieramy **jeden klaster z dwoma namespace'ami**:

- każdy namespace ma własne ResourceQuota i LimitRange;
- NetworkPolicy blokuje ruch między namespace'ami;
- osobne pliki values w Helmie i osobne Secrety;
- ten sam obraz z ECR jest promowany z bety na prod;
- osobne domeny: `beta.<domena>` i `<domena>`.

## Konsekwencje

**Pozytywne**

- Niski koszt, jedna infrastruktura do utrzymania.
- Prosty pipeline: jeden kubeconfig, dwa namespace'y.

**Negatywne**

- Słabsza izolacja: awaria węzła albo nieudany upgrade k3s dotyka obu środowisk.
- Upgrade'u klastra nie przetestujemy najpierw na becie.
- Obciążenie bety może wpłynąć na prod, jeśli limity zostaną źle ustawione.

## Kiedy wrócić do decyzji

- Prod ma realnych użytkowników i potrzebujemy SLA.
- Beta zabiera zasoby prodowi mimo limitów.
- Potrzebujemy testować upgrade'y klastra przed prodem.
