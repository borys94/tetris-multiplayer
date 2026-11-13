# Architecture Decision Records

Decyzje architektoniczne w formacie zbliżonym do [MADR](https://adr.github.io/madr/).

## Zasady

- Nowy ADR: skopiuj [0000-template.md](0000-template.md) jako `NNNN-krotki-tytul.md` z kolejnym numerem.
- Zaakceptowanych ADR-ów nie edytujemy merytorycznie. Zmiana decyzji to nowy ADR, a stary dostaje status `Superseded by ADR-NNNN`.
- Każdy ADR wskazuje milestone z [roadmapy](../roadmap.md).

## Rejestr

| # | Tytuł | Status | Milestone |
|---|---|---|---|
| [0001](0001-k3s-na-ec2.md) | Uruchamiaj Kubernetes jako k3s na EC2 zamiast EKS | Accepted | M3 |
| [0002](0002-jeden-klaster-beta-prod.md) | Trzymaj betę i prod w jednym klastrze, w osobnych namespace'ach | Accepted | M3 |
| [0003](0003-limit-16-graczy-battle-royale.md) | Ogranicz pokój battle royale do 16 graczy | Accepted | M7 |
| [0004](0004-publiczne-wydanie-tylko-z-serwerem.md) | Udostępniaj grę publicznie dopiero, gdy liczy ją serwer | Accepted | M3, M4 |
