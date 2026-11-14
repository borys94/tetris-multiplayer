# Spec 005 · Konta, role, admin i wyniki

- **Milestone:** M5 · **Status:** Approved (2026-11-14) · **ADR-y:** [0006](../adr/0006-serwer-zrodlem-prawdy.md), [0008](../adr/0008-postgres-w-klastrze.md)

## Cel

Gracz zakłada konto (login i hasło), a jego gry liczone przez serwer trafiają do bazy, rankingu i historii. Goście grają jak w v0.3, bez zapisu wyniku. Admin zarządza kontami i wynikami w panelu. Dane są w Postgresie w klastrze z codziennym backupem do S3 (v0.4).

## Wymagania

| #   | Wymaganie                                                                                                                                                                                                                                                                                                                              |
| --- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| R1  | Rejestracja, logowanie i wylogowanie loginem i hasłem. Sesja po stronie serwera w Postgresie, cookie `httpOnly`, `Secure`, `SameSite=Lax`; ochrona CSRF przez sprawdzanie `Origin`; limit nieudanych logowań na login.                                                                                                                 |
| R2  | Gra zalogowanego gracza po game over zapisuje się w bazie z wynikiem policzonym przez serwer; WebSocket rozpoznaje gracza z cookie. Gość gra bez zapisu i po game over widzi zachętę do założenia konta.                                                                                                                               |
| R3  | Publiczny ranking (najlepszy wynik każdego gracza, top 50) i historia własnych gier zalogowanego gracza.                                                                                                                                                                                                                               |
| R4  | Jedna rola: `admin`. Konto bez roli to gracz. Admin w panelu: wyszukuje konta, nadaje i odbiera rolę admina, blokuje i odblokowuje konto (blokada kończy jego sesje), ustawia hasło tymczasowe, usuwa wynik. Admin nie może odebrać roli ani zablokować samego siebie. Pierwszego admina nadaje komenda serwera uruchamiana przez SSM. |
| R5  | Postgres w klastrze, osobny w becie i prodzie, dane na dysku serwera; migracje SQL przy starcie serwera; codzienny backup do S3 z retencją 30 dni i opisanym odtworzeniem.                                                                                                                                                             |

## Scenariusze akceptacyjne

| #   | Given                              | When                                                                           | Then                                                                                                                                                   |
| --- | ---------------------------------- | ------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| S1  | Nowy gracz                         | Rejestruje się, wylogowuje i loguje / podaje złe hasło 5 razy                  | Dostaje cookie z flagami z R1 i widzi swój login; po złym haśle ten sam komunikat dla złego loginu i hasła, po 5 próbach 429 na 15 min dla tego loginu |
| S2  | Zalogowany gracz i gość            | Każdy kończy grę                                                               | Gra gracza jest w historii i w rankingu z wynikiem z wiadomości `over`; po grze gościa w bazie nie ma nowego wiersza, a UI proponuje założenie konta   |
| S3  | Zalogowany gracz                   | Strona z obcego `Origin` wysyła POST do API / otwiera WebSocket z jego cookie  | 403 w obu przypadkach                                                                                                                                  |
| S4  | Gracz i admin                      | Gracz wywołuje API admina / admin blokuje gracza i ustawia mu hasło tymczasowe | Gracz dostaje 403; zablokowany traci sesje (API 401, WebSocket gra jako gość) i nie może się zalogować; po odblokowaniu loguje się hasłem tymczasowym  |
| S5  | Baza z kontami i wynikami na becie | Restart poda Postgresa / backup i odtworzenie do pustej bazy według runbooka   | Dane są po restarcie; dump trafia do S3, a po odtworzeniu konta, wyniki i ranking są takie same                                                        |

## Design

```
apps/server/src/db/          # pool `pg`, migracje (*.sql + runner z advisory lock), repozytoria: users, sessions, games
apps/server/src/auth/        # hasła (scrypt), sesje i cookie, middleware: requireUser, requireAdmin, checkOrigin
apps/server/src/api/         # routery Express: /api/auth, /api/me, /api/leaderboard, /api/admin
apps/server/src/cli.ts       # `node main.cjs promote <login>` (pierwszy admin)
apps/web/src/account/        # logowanie, rejestracja, menu konta, historia gier
apps/web/src/leaderboard/    # ranking
apps/web/src/admin/          # panel admina (widoczny tylko dla roli admin)
deploy/helm/tetris/templates/postgres.yaml, backup-cronjob.yaml
```

Model danych:

```sql
users    (id bigserial, username text unique (lower), password_hash text, role text null check (role = 'admin'),  -- null = gracz
          disabled_at timestamptz, created_at timestamptz)
sessions (id bytea pk  -- sha256 tokenu z cookie, user_id → users on delete cascade, expires_at, created_at)
games    (id bigserial, user_id → users on delete cascade, score int, lines int, level int, ticks int, ended_at timestamptz)
```

API (JSON; każdy POST/PATCH/DELETE wymaga `Origin` równego `ALLOWED_ORIGIN`):

| Endpoint                                                                                              | Dostęp | Opis                                                                            |
| ----------------------------------------------------------------------------------------------------- | ------ | ------------------------------------------------------------------------------- |
| `POST /api/auth/register`, `/login`, `/logout`                                                        | każdy  | Konto i sesja                                                                   |
| `GET /api/me`, `GET /api/me/games`                                                                    | gracz  | Profil i historia (ostatnie 50 gier)                                            |
| `GET /api/leaderboard`                                                                                | każdy  | Top 50, najlepszy wynik na gracza (z `gameId`)                                  |
| `GET /api/admin/users?q=`, `PATCH /api/admin/users/:id`                                               | admin  | Wyszukiwanie; zmiana `role` (`admin`/`null`) i `disabled`                       |
| `POST /api/admin/users/:id/password`, `GET /api/admin/users/:id/games`, `DELETE /api/admin/games/:id` | admin  | Hasło tymczasowe (pokazane raz, wylogowuje konto); gry gracza; usunięcie wyniku |

| Obszar        | Decyzja                                                                                                                                                                                                                                                                                                                                                       |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Baza          | Postgres 17 jako StatefulSet w każdym namespace, PVC 2 Gi (`local-path`), dostęp tylko z poda aplikacji (NetworkPolicy); hasło w Secrecie generowanym przez Helm (`lookup`, stałe między deployami) (ADR-0008)                                                                                                                                                |
| Dostęp z kodu | `pg` bez ORM-a; SQL w repozytoriach; migracje jako numerowane pliki `.sql`, uruchamiane przy starcie pod `pg_advisory_lock`                                                                                                                                                                                                                                   |
| Hasła         | `scrypt` z `node:crypto` (N=2^15, r=8, p=1, sól 16 B), porównanie w stałym czasie; login 3–20 znaków `[a-z0-9_-]` bez rozróżniania wielkości liter, hasło 10–128 znaków                                                                                                                                                                                       |
| Sesje         | Losowy token 32 B w cookie `sid`, w bazie tylko jego SHA-256; ważność 30 dni, przedłużana przy użyciu; wylogowanie i blokada usuwają sesje. Nie JWT: odwołanie sesji (blokada przez admina) wymagałoby listy unieważnionych tokenów, a token w `localStorage` byłby dostępny dla XSS. Nie Redis: kolejny komponent w 2 GB RAM bez potrzeby przy obecnym ruchu |
| CSRF          | `SameSite=Lax` i sprawdzanie `Origin` przy każdej zmianie stanu (API i upgrade WebSocketu); API przyjmuje tylko `application/json`. Frontend i API są pod jednym hostem, więc tokeny CSRF nie są potrzebne                                                                                                                                                    |
| Limit logowań | 5 nieudanych prób na login → 429 na 15 min (w pamięci procesu). Limitu na IP brak, bo Traefik nie widzi adresów klientów (spec 004)                                                                                                                                                                                                                           |
| Gra i konto   | Przy upgrade WebSocketu serwer czyta cookie i przypina `userId` do sesji gry; zapis wiersza `games` w chwili `over`, poza pętlą ticków (błąd zapisu nie zatrzymuje gry, tylko trafia do logu)                                                                                                                                                                 |
| Role          | Kolumna `role` z jedyną wartością `admin`; `null` oznacza gracza. Sprawdzanie w middleware na serwerze, UI tylko ukrywa panel. Kolejna rola to nowa wartość w `check`, a uprawnienia częściowe to migracja do tabeli uprawnień                                                                                                                                |
| Frontend      | Widoki: gra, ranking, konto, admin; przełączane stanem w `App` z hashem w URL (`#/ranking`), bez biblioteki routera                                                                                                                                                                                                                                           |
| Backup        | CronJob 03:00: `pg_dump -Fc` → `s3://<bucket>/<env>/<data>.dump`; bucket w `bootstrap` (przeżywa `destroy` maina), lifecycle 30 dni. Uprawnienia z roli serwera: IMDS z limitem 2 hopów, a NetworkPolicy odcina IMDS wszystkim podom poza backupem                                                                                                            |
| Testy         | Testy repozytoriów i API na prawdziwym Postgresie z `@testcontainers/postgresql` (lokalnie i w CI)                                                                                                                                                                                                                                                            |

Poza zakresem: e-mail, samodzielny reset hasła i logowanie przez zewnętrznych dostawców; usuwanie konta przez gracza; replay i audyt gier; HA bazy i point-in-time recovery; limit na IP (wymaga `externalTrafficPolicy: Local`).

## Zadania

| #   | Zadanie                                                                                                                                                                    | Pokrywa        | Status |
| --- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------- | ------ |
| T1  | Baza w kodzie: `pg`, migracje z advisory lock, schemat, repozytoria; testy na Testcontainers (lokalnie i w CI)                                                             | R5             | ☐      |
| T2  | Konta: hasła, sesje i cookie, `/api/auth`, `/api/me`, Origin/CSRF, limit logowań; WebSocket z `userId` i zapis gier                                                        | R1, R2, S1–S3  | ☐      |
| T3  | Ranking, historia, API admina z rolą admina i blokadą, komenda `promote`                                                                                                   | R3, R4, S2, S4 | ☐      |
| T4  | Web: logowanie i rejestracja, menu konta, zachęta po grze gościa, ranking, historia, panel admina                                                                          | R1–R4, S1, S2  | ☐      |
| T5  | Deploy: Postgres i Secret w chartcie, NetworkPolicy (IMDS), backup CronJob, bucket i IAM w OpenTofu, IMDS 2 hopy; runbook (admin, backup, odtworzenie); weryfikacja na AWS | R5, S5         | ☐      |
