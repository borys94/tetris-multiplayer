# ADR-0008: Trzymaj dane w Postgresie uruchomionym w klastrze k3s

- **Status:** Accepted
- **Data:** 2026-11-14
- **Milestone:** M5, M7

## Kontekst

Od M5 zapisujemy konta, sesje i wyniki gier. Dane są relacyjne (gracz → gry, ranking jako zapytanie z agregacją), a ich utrata kosztuje zaufanie graczy. Cała aplikacja działa na jednym serwerze EC2 t4g.small (2 GB RAM) z k3s, z betą i prodem w osobnych namespace'ach ([ADR-0001](0001-k3s-na-ec2.md), [ADR-0002](0002-jeden-klaster-beta-prod.md)). Budżet to ok. 18 USD/mies.

## Rozważane opcje

1. **Postgres w klastrze:** StatefulSet w każdym namespace, dane na dysku serwera, backup `pg_dump` do S3. Koszt ok. 0 USD, ok. 100–150 MB RAM na instancję.
2. **RDS Postgres (db.t4g.micro):** automatyczne backupy, aktualizacje i PITR; ok. 15–20 USD/mies. więcej, czyli podwojenie kosztów.
3. **MongoDB:** elastyczny schemat, ale dane są relacyjne, a ranking i role łatwiej wyrazić w SQL.
4. **SQLite na wolumenie poda:** najlżejsze, ale zapis z jednego procesu blokuje skalowanie serwera w M7.

## Decyzja

Wybieramy **opcję 1**:

- Postgres 17 jako StatefulSet z PVC (`local-path`) w `tetris-beta` i `tetris-prod`; beta i prod nie współdzielą danych;
- dostęp do bazy tylko z poda aplikacji w tym samym namespace (NetworkPolicy); hasło w Secrecie generowanym przez Helm przy pierwszej instalacji;
- codzienny `pg_dump` do bucketu S3 z retencją 30 dni; bucket żyje w `bootstrap`, więc przeżywa usunięcie serwera;
- backup używa roli serwera przez IMDS (limit 2 hopy), a NetworkPolicy odcina IMDS wszystkim podom poza backupem.

## Konsekwencje

**Pozytywne**

- Brak dodatkowych kosztów; baza blisko aplikacji (bez opóźnień sieci VPC).
- SQL i transakcje pasują do kont, rankingu i ról; ten sam Postgres obsłuży M7.

**Negatywne**

- Awaria lub utrata dysku serwera oznacza utratę danych od ostatniego backupu (do 24 h).
- Aktualizacje Postgresa, monitorowanie miejsca na dysku i test odtworzenia robimy sami (runbook).
- Postgres zajmuje część z 2 GB RAM serwera.

## Kiedy wrócić do decyzji

- Utrata do 24 h danych przestanie być akceptowalna (np. płatności, duży ranking): przejście na RDS lub PITR (WAL do S3).
- Metryki z M6 pokażą brak pamięci na serwerze albo przejdziemy na EKS ([ADR-0001](0001-k3s-na-ec2.md)).
