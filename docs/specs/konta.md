# Konta i role

- **Status:** Aktualny (2026-11-15) · **Historia:** M5 · **ADR-y:** [0008](../adr/0008-postgres-w-klastrze.md)

## Cel

Gracz zakłada konto (login i hasło) i gra pod nim, a sesja przeżywa zamknięcie przeglądarki. Konto może mieć rolę admina, która otwiera [panel admina](panel-admina.md). Goście grają bez konta.

## Wymagania

| #   | Wymaganie                                                                                                                                                                                                                            |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| R1  | Rejestracja, logowanie i wylogowanie loginem i hasłem. Login: 3–20 znaków `[a-z0-9_-]`, unikalny bez względu na wielkość liter; hasło: 10–128 znaków. Rejestracja od razu loguje.                                                    |
| R2  | Ochrona CSRF: każda zmiana stanu w API i upgrade WebSocketu wymaga `Origin` równego hostowi gry.                                                                                                                                     |
| R3  | Logowanie nie zdradza, czy login istnieje (ten sam komunikat i podobny czas odpowiedzi); po 5 nieudanych próbach login jest zablokowany na 15 min. Konto zablokowane przez admina nie może się zalogować.                            |
| R4  | WebSocket rozpoznaje gracza z cookie; zablokowane konto lub brak ważnej sesji to gość.                                                                                                                                               |
| R5  | Jedna rola: `admin`, sprawdzana na serwerze (UI tylko ukrywa panel). Konto bez roli to gracz. Pierwszego admina nadaje komenda serwera uruchamiana przez SSM.                                                                        |
| R6  | Sesja po stronie serwera w cookie `httpOnly`, `Secure`, `SameSite=Lax`, ważna 30 dni od ostatniego użycia. Wylogowanie kończy bieżącą sesję; blokada konta i hasło tymczasowe kończą wszystkie. Hasła przechowujemy tylko jako hash. |

## Scenariusze akceptacyjne

| #   | Given                            | When                                                                     | Then                                                                                                                              |
| --- | -------------------------------- | ------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------- |
| S1  | Nowy gracz                       | Rejestruje się, wylogowuje i loguje / podaje złe hasło 5 razy            | Dostaje cookie z flagami z R6 i widzi swój login; po złym haśle `invalid_credentials`, po 5 próbach 429 na 15 min dla tego loginu |
| S2  | Zalogowany gracz                 | Strona z obcego `Origin` wysyła POST do API / otwiera WebSocket z cookie | 403 w obu przypadkach                                                                                                             |
| S3  | Konto bez roli                   | Wywołuje API admina                                                      | 403                                                                                                                               |
| S4  | Istnieje konto `adam`            | Ktoś rejestruje `Adam` / login `a!` / hasło 9-znakowe                    | 409 `username_taken` / 400 `invalid_username` / 400 `invalid_password`; konto nie powstaje                                        |
| S5  | Konto zablokowane przez admina   | Loguje się poprawnym hasłem / otwiera grę ze starym cookie               | 403 `account_disabled` / gra jako gość                                                                                            |
| S6  | Sesja nieużywana przez 30 dni    | Gracz otwiera stronę                                                     | Jest wylogowany; sesja używana wcześniej przedłuża się o 30 dni                                                                   |
| S7  | Konto bez roli, dostęp przez SSM | Operator uruchamia `promote <login>`                                     | Po ponownym wczytaniu strony konto widzi panel admina                                                                             |

## Design

```
apps/server/src/accounts/    # hasła (scrypt), cookie sesji, authenticator (API i WS), limit logowań, operacje admina
apps/server/src/db/          # users.ts, sessions.ts
apps/server/src/http/api/    # auth.ts, me.ts, middleware.ts (Origin, requireUser, requireAdmin)
apps/server/src/cli.ts       # `node main.cjs promote <login>`
apps/web/src/domains/account/model/account.ts   # sprawdzenie sesji przy starcie, logowanie, rejestracja, wylogowanie
apps/web/src/domains/account/          # useAccount, logowanie, rejestracja, menu konta, profil
```

```sql
users    (id bigserial, username text unique (lower), password_hash text, role text null check (role = 'admin'),  -- null = gracz
          disabled_at timestamptz, created_at timestamptz)
sessions (id bytea pk  -- sha256 tokenu z cookie, user_id → users on delete cascade, expires_at, created_at)
```

| Endpoint                  | Dostęp | Odpowiedzi                                                                                                                       |
| ------------------------- | ------ | -------------------------------------------------------------------------------------------------------------------------------- |
| `POST /api/auth/register` | każdy  | 201 `{user}` + cookie; 400 `invalid_username`, `invalid_password`; 409 `username_taken`                                          |
| `POST /api/auth/login`    | każdy  | 200 `{user}` + cookie; 400 `invalid`; 401 `invalid_credentials`; 403 `account_disabled`; 429 `too_many_attempts` z `Retry-After` |
| `POST /api/auth/logout`   | każdy  | 204, cookie wyczyszczone                                                                                                         |
| `GET /api/me`             | gracz  | 200 profil; 401 `unauthenticated` bez ważnej sesji                                                                               |

Każdy endpoint zmieniający stan: 403 `origin` przy obcym lub brakującym `Origin`, 415 `json_required` dla treści innej niż `application/json`.

| Obszar        | Decyzja                                                                                                                                                                                                                                                                            |
| ------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Hasła         | `scrypt` z `node:crypto` (N=2^15, r=8, p=1, sól 16 B), porównanie w stałym czasie. Dla nieistniejącego loginu serwer też liczy hash (atrapa), żeby czas odpowiedzi nie zdradzał loginu                                                                                             |
| Sesje         | Losowy token 32 B w cookie `sid`, w bazie tylko jego SHA-256; `expires_at` przesuwane przy użyciu. Nie JWT: odwołanie sesji wymagałoby listy unieważnionych tokenów, a token w `localStorage` byłby dostępny dla XSS. Nie Redis: kolejny komponent bez potrzeby przy obecnym ruchu |
| CSRF          | `SameSite=Lax` i sprawdzanie `Origin`; API przyjmuje tylko `application/json`. Frontend i API są pod jednym hostem, więc tokeny CSRF nie są potrzebne                                                                                                                              |
| Limit logowań | Licznik na login w pamięci procesu; udane logowanie go zeruje, restart poda czyści. Limitu na IP brak, bo Traefik nie widzi adresów klientów ([siec-protokol](siec-protokol.md))                                                                                                   |
| Gra i konto   | Przy upgrade WebSocketu serwer czyta cookie i przypina `userId` do sesji gry                                                                                                                                                                                                       |
| Role          | Kolumna `role` z jedyną wartością `admin`. Kolejna rola to nowa wartość w `check`, a uprawnienia częściowe to migracja do tabeli uprawnień                                                                                                                                         |

**Znane ryzyko:** limit na login pozwala każdemu, kto zna login, zablokować cudze logowanie na 15 min (istniejące sesje działają dalej). Akceptujemy to przy obecnym ruchu; wracamy do tematu, gdy serwer zobaczy IP klientów (`externalTrafficPolicy: Local`) i da się dodać limit na parę IP + login.

Poza zakresem: e-mail, samodzielny reset i zmiana hasła, „wyloguj wszędzie” dla gracza, usuwanie konta przez gracza (do zrobienia przed szerszym udostępnieniem: RODO), logowanie przez zewnętrznych dostawców, limit logowań na IP.
