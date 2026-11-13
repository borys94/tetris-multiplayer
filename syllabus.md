# Multiplayer Tetris — plan kursu (60 lekcji)

## Cel

Zbudowanie i wdrożenie gry multiplayer 1v1 z użyciem React, Node.js i AWS. Każda lekcja odbywa się w osobnym czacie, kończy się sprawdzalnym przyrostem aplikacji lub dokumentacji oraz aktualizacją `progress.md`.

## Zasady

- Praca w cyklu SDD: wymagania → specyfikacja → projekt techniczny → zadania → implementacja w Claude Code → testy i przegląd → aktualizacja postępów.
- Każda funkcja ma kryteria akceptacji, przypadki brzegowe i dowody weryfikacji.
- Co pięć lekcji: test wiedzy, przegląd architektury i retrospektywa.
- Stack: React, TypeScript, Vite, Canvas 2D; Node.js, Express.js, WebSocket (`ws`); Yarn Workspaces/Turborepo; PostgreSQL/Drizzle; Redis; Vitest/Playwright; Docker; AWS ECS Fargate, RDS, S3/CloudFront; Terraform; GitHub Actions; OpenTelemetry, Prometheus i Grafana.
- Na początku modularny monolit, deterministyczny silnik gry i autorytatywny serwer multiplayer. Infrastrukturę chmurową wdrażamy etapami, z kontrolą kosztów.

## Kamienie milowe

| Etap | Po lekcji | Warunek zaliczenia |
|---|---:|---|
| M1: Fundament inżynierski | 5 | Monorepo, specyfikacje, konwencje i działające CI |
| M2: Beta single-player | 25 | Grywalna aplikacja przeglądarkowa z testami E2E |
| M3: MVP multiplayer | 30 | Pojedynki 1v1 z autorytatywnym serwerem i podstawami reconnect |
| M4: Beta rywalizacji | 35 | Matchmaking, ranking i replay |
| M5: Beta w chmurze | 45 | Wdrożenie AWS beta i kontrolowany proces produkcyjny |
| M6: Produkcja 1.0 | 60 | Audyty, monitoring, odporność i zatwierdzona lista gotowości |

## Moduł 01: Podstawy i Spec-Driven Development

### Lekcja 01 — Analiza wymagań, MVP i architektura docelowa

- **Cel:** Zrozumieć i zastosować zagadnienie: analiza wymagań, mvp i architektura docelowa.
- **Rezultat:** Zatwierdzona, ograniczona zakresem zmiana w kodzie, infrastrukturze lub dokumentacji, zgodna z tematem lekcji.
- **Artefakty SDD:** `specs/001-<slug>/requirements.md`, `spec.md`, `design.md`, `tasks.md` (dla pracy wyłącznie organizacyjnej można uzasadnić pominięcie wybranych artefaktów).
- **Weryfikacja:** Powiązanie kryteriów akceptacji z testami, wyniki kontroli CI lub manualnych, przegląd zmian i aktualizacja `progress.md`.

### Lekcja 02 — Test diagnostyczny i organizacja pracy z AI

- **Cel:** Zrozumieć i zastosować zagadnienie: test diagnostyczny i organizacja pracy z ai.
- **Rezultat:** Zatwierdzona, ograniczona zakresem zmiana w kodzie, infrastrukturze lub dokumentacji, zgodna z tematem lekcji.
- **Artefakty SDD:** `specs/002-<slug>/requirements.md`, `spec.md`, `design.md`, `tasks.md` (dla pracy wyłącznie organizacyjnej można uzasadnić pominięcie wybranych artefaktów).
- **Weryfikacja:** Powiązanie kryteriów akceptacji z testami, wyniki kontroli CI lub manualnych, przegląd zmian i aktualizacja `progress.md`.

### Lekcja 03 — Monorepo, TypeScript, Yarn i Turborepo

- **Cel:** Zrozumieć i zastosować zagadnienie: monorepo, typescript, yarn i turborepo.
- **Rezultat:** Zatwierdzona, ograniczona zakresem zmiana w kodzie, infrastrukturze lub dokumentacji, zgodna z tematem lekcji.
- **Artefakty SDD:** `specs/003-<slug>/requirements.md`, `spec.md`, `design.md`, `tasks.md` (dla pracy wyłącznie organizacyjnej można uzasadnić pominięcie wybranych artefaktów).
- **Weryfikacja:** Powiązanie kryteriów akceptacji z testami, wyniki kontroli CI lub manualnych, przegląd zmian i aktualizacja `progress.md`.

### Lekcja 04 — Dokumentacja, ADR, konwencje i szablony SDD

- **Cel:** Zrozumieć i zastosować zagadnienie: dokumentacja, adr, konwencje i szablony sdd.
- **Rezultat:** Zatwierdzona, ograniczona zakresem zmiana w kodzie, infrastrukturze lub dokumentacji, zgodna z tematem lekcji.
- **Artefakty SDD:** `specs/004-<slug>/requirements.md`, `spec.md`, `design.md`, `tasks.md` (dla pracy wyłącznie organizacyjnej można uzasadnić pominięcie wybranych artefaktów).
- **Weryfikacja:** Powiązanie kryteriów akceptacji z testami, wyniki kontroli CI lub manualnych, przegląd zmian i aktualizacja `progress.md`.

### Lekcja 05 — CI: lint, sprawdzanie typów, testy i kontrole PR

- **Cel:** Zrozumieć i zastosować zagadnienie: ci: lint, sprawdzanie typów, testy i kontrole pr.
- **Rezultat:** Zatwierdzona, ograniczona zakresem zmiana w kodzie, infrastrukturze lub dokumentacji, zgodna z tematem lekcji.
- **Artefakty SDD:** `specs/005-<slug>/requirements.md`, `spec.md`, `design.md`, `tasks.md` (dla pracy wyłącznie organizacyjnej można uzasadnić pominięcie wybranych artefaktów).
- **Weryfikacja:** Powiązanie kryteriów akceptacji z testami, wyniki kontroli CI lub manualnych, przegląd zmian i aktualizacja `progress.md`.

**Po module:** Przegląd przyrostu, otwartych ryzyk i zależności przed kolejnym modułem.

## Moduł 02: Fundamenty silnika gry

### Lekcja 06 — Model domenowy i stan gry

- **Cel:** Zrozumieć i zastosować zagadnienie: model domenowy i stan gry.
- **Rezultat:** Zatwierdzona, ograniczona zakresem zmiana w kodzie, infrastrukturze lub dokumentacji, zgodna z tematem lekcji.
- **Artefakty SDD:** `specs/006-<slug>/requirements.md`, `spec.md`, `design.md`, `tasks.md` (dla pracy wyłącznie organizacyjnej można uzasadnić pominięcie wybranych artefaktów).
- **Weryfikacja:** Powiązanie kryteriów akceptacji z testami, wyniki kontroli CI lub manualnych, przegląd zmian i aktualizacja `progress.md`.

### Lekcja 07 — Plansza, tetromino i układ współrzędnych

- **Cel:** Zrozumieć i zastosować zagadnienie: plansza, tetromino i układ współrzędnych.
- **Rezultat:** Zatwierdzona, ograniczona zakresem zmiana w kodzie, infrastrukturze lub dokumentacji, zgodna z tematem lekcji.
- **Artefakty SDD:** `specs/007-<slug>/requirements.md`, `spec.md`, `design.md`, `tasks.md` (dla pracy wyłącznie organizacyjnej można uzasadnić pominięcie wybranych artefaktów).
- **Weryfikacja:** Powiązanie kryteriów akceptacji z testami, wyniki kontroli CI lub manualnych, przegląd zmian i aktualizacja `progress.md`.

### Lekcja 08 — Ruch, wykrywanie kolizji i granice planszy

- **Cel:** Zrozumieć i zastosować zagadnienie: ruch, wykrywanie kolizji i granice planszy.
- **Rezultat:** Zatwierdzona, ograniczona zakresem zmiana w kodzie, infrastrukturze lub dokumentacji, zgodna z tematem lekcji.
- **Artefakty SDD:** `specs/008-<slug>/requirements.md`, `spec.md`, `design.md`, `tasks.md` (dla pracy wyłącznie organizacyjnej można uzasadnić pominięcie wybranych artefaktów).
- **Weryfikacja:** Powiązanie kryteriów akceptacji z testami, wyniki kontroli CI lub manualnych, przegląd zmian i aktualizacja `progress.md`.

### Lekcja 09 — Obrót, SRS i wall kicks

- **Cel:** Zrozumieć i zastosować zagadnienie: obrót, srs i wall kicks.
- **Rezultat:** Zatwierdzona, ograniczona zakresem zmiana w kodzie, infrastrukturze lub dokumentacji, zgodna z tematem lekcji.
- **Artefakty SDD:** `specs/009-<slug>/requirements.md`, `spec.md`, `design.md`, `tasks.md` (dla pracy wyłącznie organizacyjnej można uzasadnić pominięcie wybranych artefaktów).
- **Weryfikacja:** Powiązanie kryteriów akceptacji z testami, wyniki kontroli CI lub manualnych, przegląd zmian i aktualizacja `progress.md`.

### Lekcja 10 — Generator 7-bag, kolejka następnych figur i ghost piece

- **Cel:** Zrozumieć i zastosować zagadnienie: generator 7-bag, kolejka następnych figur i ghost piece.
- **Rezultat:** Zatwierdzona, ograniczona zakresem zmiana w kodzie, infrastrukturze lub dokumentacji, zgodna z tematem lekcji.
- **Artefakty SDD:** `specs/010-<slug>/requirements.md`, `spec.md`, `design.md`, `tasks.md` (dla pracy wyłącznie organizacyjnej można uzasadnić pominięcie wybranych artefaktów).
- **Weryfikacja:** Powiązanie kryteriów akceptacji z testami, wyniki kontroli CI lub manualnych, przegląd zmian i aktualizacja `progress.md`.

**Po module:** Przegląd przyrostu, otwartych ryzyk i zależności przed kolejnym modułem.

## Moduł 03: Zaawansowane mechaniki gry

### Lekcja 11 — Grawitacja, pętla gry i stały krok czasowy

- **Cel:** Zrozumieć i zastosować zagadnienie: grawitacja, pętla gry i stały krok czasowy.
- **Rezultat:** Zatwierdzona, ograniczona zakresem zmiana w kodzie, infrastrukturze lub dokumentacji, zgodna z tematem lekcji.
- **Artefakty SDD:** `specs/011-<slug>/requirements.md`, `spec.md`, `design.md`, `tasks.md` (dla pracy wyłącznie organizacyjnej można uzasadnić pominięcie wybranych artefaktów).
- **Weryfikacja:** Powiązanie kryteriów akceptacji z testami, wyniki kontroli CI lub manualnych, przegląd zmian i aktualizacja `progress.md`.

### Lekcja 12 — Soft drop, hard drop i opóźnienie blokowania

- **Cel:** Zrozumieć i zastosować zagadnienie: soft drop, hard drop i opóźnienie blokowania.
- **Rezultat:** Zatwierdzona, ograniczona zakresem zmiana w kodzie, infrastrukturze lub dokumentacji, zgodna z tematem lekcji.
- **Artefakty SDD:** `specs/012-<slug>/requirements.md`, `spec.md`, `design.md`, `tasks.md` (dla pracy wyłącznie organizacyjnej można uzasadnić pominięcie wybranych artefaktów).
- **Weryfikacja:** Powiązanie kryteriów akceptacji z testami, wyniki kontroli CI lub manualnych, przegląd zmian i aktualizacja `progress.md`.

### Lekcja 13 — Hold piece i przejścia stanów

- **Cel:** Zrozumieć i zastosować zagadnienie: hold piece i przejścia stanów.
- **Rezultat:** Zatwierdzona, ograniczona zakresem zmiana w kodzie, infrastrukturze lub dokumentacji, zgodna z tematem lekcji.
- **Artefakty SDD:** `specs/013-<slug>/requirements.md`, `spec.md`, `design.md`, `tasks.md` (dla pracy wyłącznie organizacyjnej można uzasadnić pominięcie wybranych artefaktów).
- **Weryfikacja:** Powiązanie kryteriów akceptacji z testami, wyniki kontroli CI lub manualnych, przegląd zmian i aktualizacja `progress.md`.

### Lekcja 14 — Usuwanie linii, punktacja, combo i back-to-back

- **Cel:** Zrozumieć i zastosować zagadnienie: usuwanie linii, punktacja, combo i back-to-back.
- **Rezultat:** Zatwierdzona, ograniczona zakresem zmiana w kodzie, infrastrukturze lub dokumentacji, zgodna z tematem lekcji.
- **Artefakty SDD:** `specs/014-<slug>/requirements.md`, `spec.md`, `design.md`, `tasks.md` (dla pracy wyłącznie organizacyjnej można uzasadnić pominięcie wybranych artefaktów).
- **Weryfikacja:** Powiązanie kryteriów akceptacji z testami, wyniki kontroli CI lub manualnych, przegląd zmian i aktualizacja `progress.md`.

### Lekcja 15 — Koniec gry, reset i testy właściwości

- **Cel:** Zrozumieć i zastosować zagadnienie: koniec gry, reset i testy właściwości.
- **Rezultat:** Zatwierdzona, ograniczona zakresem zmiana w kodzie, infrastrukturze lub dokumentacji, zgodna z tematem lekcji.
- **Artefakty SDD:** `specs/015-<slug>/requirements.md`, `spec.md`, `design.md`, `tasks.md` (dla pracy wyłącznie organizacyjnej można uzasadnić pominięcie wybranych artefaktów).
- **Weryfikacja:** Powiązanie kryteriów akceptacji z testami, wyniki kontroli CI lub manualnych, przegląd zmian i aktualizacja `progress.md`.

**Po module:** Przegląd przyrostu, otwartych ryzyk i zależności przed kolejnym modułem.

## Moduł 04: Klient gry w React

### Lekcja 16 — Architektura Reacta i rozdzielenie odpowiedzialności

- **Cel:** Zrozumieć i zastosować zagadnienie: architektura reacta i rozdzielenie odpowiedzialności.
- **Rezultat:** Zatwierdzona, ograniczona zakresem zmiana w kodzie, infrastrukturze lub dokumentacji, zgodna z tematem lekcji.
- **Artefakty SDD:** `specs/016-<slug>/requirements.md`, `spec.md`, `design.md`, `tasks.md` (dla pracy wyłącznie organizacyjnej można uzasadnić pominięcie wybranych artefaktów).
- **Weryfikacja:** Powiązanie kryteriów akceptacji z testami, wyniki kontroli CI lub manualnych, przegląd zmian i aktualizacja `progress.md`.

### Lekcja 17 — Renderer Canvas, zmiana rozmiaru i wydajność

- **Cel:** Zrozumieć i zastosować zagadnienie: renderer canvas, zmiana rozmiaru i wydajność.
- **Rezultat:** Zatwierdzona, ograniczona zakresem zmiana w kodzie, infrastrukturze lub dokumentacji, zgodna z tematem lekcji.
- **Artefakty SDD:** `specs/017-<slug>/requirements.md`, `spec.md`, `design.md`, `tasks.md` (dla pracy wyłącznie organizacyjnej można uzasadnić pominięcie wybranych artefaktów).
- **Weryfikacja:** Powiązanie kryteriów akceptacji z testami, wyniki kontroli CI lub manualnych, przegląd zmian i aktualizacja `progress.md`.

### Lekcja 18 — Sterowanie klawiaturą, DAS i ARR

- **Cel:** Zrozumieć i zastosować zagadnienie: sterowanie klawiaturą, das i arr.
- **Rezultat:** Zatwierdzona, ograniczona zakresem zmiana w kodzie, infrastrukturze lub dokumentacji, zgodna z tematem lekcji.
- **Artefakty SDD:** `specs/018-<slug>/requirements.md`, `spec.md`, `design.md`, `tasks.md` (dla pracy wyłącznie organizacyjnej można uzasadnić pominięcie wybranych artefaktów).
- **Weryfikacja:** Powiązanie kryteriów akceptacji z testami, wyniki kontroli CI lub manualnych, przegląd zmian i aktualizacja `progress.md`.

### Lekcja 19 — HUD, ustawienia, kolejka figur, hold i dźwięk

- **Cel:** Zrozumieć i zastosować zagadnienie: hud, ustawienia, kolejka figur, hold i dźwięk.
- **Rezultat:** Zatwierdzona, ograniczona zakresem zmiana w kodzie, infrastrukturze lub dokumentacji, zgodna z tematem lekcji.
- **Artefakty SDD:** `specs/019-<slug>/requirements.md`, `spec.md`, `design.md`, `tasks.md` (dla pracy wyłącznie organizacyjnej można uzasadnić pominięcie wybranych artefaktów).
- **Weryfikacja:** Powiązanie kryteriów akceptacji z testami, wyniki kontroli CI lub manualnych, przegląd zmian i aktualizacja `progress.md`.

### Lekcja 20 — Dostępność, testy E2E Playwright i wydanie single-player

- **Cel:** Zrozumieć i zastosować zagadnienie: dostępność, testy e2e playwright i wydanie single-player.
- **Rezultat:** Zatwierdzona, ograniczona zakresem zmiana w kodzie, infrastrukturze lub dokumentacji, zgodna z tematem lekcji.
- **Artefakty SDD:** `specs/020-<slug>/requirements.md`, `spec.md`, `design.md`, `tasks.md` (dla pracy wyłącznie organizacyjnej można uzasadnić pominięcie wybranych artefaktów).
- **Weryfikacja:** Powiązanie kryteriów akceptacji z testami, wyniki kontroli CI lub manualnych, przegląd zmian i aktualizacja `progress.md`.

**Po module:** Przegląd przyrostu, otwartych ryzyk i zależności przed kolejnym modułem.

## Moduł 05: Backend i trwałość danych

### Lekcja 21 — Express, REST API, walidacja i obsługa błędów

- **Cel:** Zrozumieć i zastosować zagadnienie: express, rest api, walidacja i obsługa błędów.
- **Rezultat:** Zatwierdzona, ograniczona zakresem zmiana w kodzie, infrastrukturze lub dokumentacji, zgodna z tematem lekcji.
- **Artefakty SDD:** `specs/021-<slug>/requirements.md`, `spec.md`, `design.md`, `tasks.md` (dla pracy wyłącznie organizacyjnej można uzasadnić pominięcie wybranych artefaktów).
- **Weryfikacja:** Powiązanie kryteriów akceptacji z testami, wyniki kontroli CI lub manualnych, przegląd zmian i aktualizacja `progress.md`.

### Lekcja 22 — PostgreSQL, Drizzle, migracje i repozytoria

- **Cel:** Zrozumieć i zastosować zagadnienie: postgresql, drizzle, migracje i repozytoria.
- **Rezultat:** Zatwierdzona, ograniczona zakresem zmiana w kodzie, infrastrukturze lub dokumentacji, zgodna z tematem lekcji.
- **Artefakty SDD:** `specs/022-<slug>/requirements.md`, `spec.md`, `design.md`, `tasks.md` (dla pracy wyłącznie organizacyjnej można uzasadnić pominięcie wybranych artefaktów).
- **Weryfikacja:** Powiązanie kryteriów akceptacji z testami, wyniki kontroli CI lub manualnych, przegląd zmian i aktualizacja `progress.md`.

### Lekcja 23 — Uwierzytelnianie, autoryzacja i profile

- **Cel:** Zrozumieć i zastosować zagadnienie: uwierzytelnianie, autoryzacja i profile.
- **Rezultat:** Zatwierdzona, ograniczona zakresem zmiana w kodzie, infrastrukturze lub dokumentacji, zgodna z tematem lekcji.
- **Artefakty SDD:** `specs/023-<slug>/requirements.md`, `spec.md`, `design.md`, `tasks.md` (dla pracy wyłącznie organizacyjnej można uzasadnić pominięcie wybranych artefaktów).
- **Weryfikacja:** Powiązanie kryteriów akceptacji z testami, wyniki kontroli CI lub manualnych, przegląd zmian i aktualizacja `progress.md`.

### Lekcja 24 — Historia meczów, statystyki graczy i transakcje

- **Cel:** Zrozumieć i zastosować zagadnienie: historia meczów, statystyki graczy i transakcje.
- **Rezultat:** Zatwierdzona, ograniczona zakresem zmiana w kodzie, infrastrukturze lub dokumentacji, zgodna z tematem lekcji.
- **Artefakty SDD:** `specs/024-<slug>/requirements.md`, `spec.md`, `design.md`, `tasks.md` (dla pracy wyłącznie organizacyjnej można uzasadnić pominięcie wybranych artefaktów).
- **Weryfikacja:** Powiązanie kryteriów akceptacji z testami, wyniki kontroli CI lub manualnych, przegląd zmian i aktualizacja `progress.md`.

### Lekcja 25 — Testy integracyjne, Docker Compose i kontrakty API

- **Cel:** Zrozumieć i zastosować zagadnienie: testy integracyjne, docker compose i kontrakty api.
- **Rezultat:** Zatwierdzona, ograniczona zakresem zmiana w kodzie, infrastrukturze lub dokumentacji, zgodna z tematem lekcji.
- **Artefakty SDD:** `specs/025-<slug>/requirements.md`, `spec.md`, `design.md`, `tasks.md` (dla pracy wyłącznie organizacyjnej można uzasadnić pominięcie wybranych artefaktów).
- **Weryfikacja:** Powiązanie kryteriów akceptacji z testami, wyniki kontroli CI lub manualnych, przegląd zmian i aktualizacja `progress.md`.

**Po module:** Przegląd przyrostu, otwartych ryzyk i zależności przed kolejnym modułem.

## Moduł 06: Multiplayer w czasie rzeczywistym

### Lekcja 26 — Protokół WebSocket, kontrakty Zod i cykl życia połączenia

- **Cel:** Zrozumieć i zastosować zagadnienie: protokół websocket, kontrakty zod i cykl życia połączenia.
- **Rezultat:** Zatwierdzona, ograniczona zakresem zmiana w kodzie, infrastrukturze lub dokumentacji, zgodna z tematem lekcji.
- **Artefakty SDD:** `specs/026-<slug>/requirements.md`, `spec.md`, `design.md`, `tasks.md` (dla pracy wyłącznie organizacyjnej można uzasadnić pominięcie wybranych artefaktów).
- **Weryfikacja:** Powiązanie kryteriów akceptacji z testami, wyniki kontroli CI lub manualnych, przegląd zmian i aktualizacja `progress.md`.

### Lekcja 27 — Autorytatywny silnik serwerowy i sekwencjonowanie wejścia

- **Cel:** Zrozumieć i zastosować zagadnienie: autorytatywny silnik serwerowy i sekwencjonowanie wejścia.
- **Rezultat:** Zatwierdzona, ograniczona zakresem zmiana w kodzie, infrastrukturze lub dokumentacji, zgodna z tematem lekcji.
- **Artefakty SDD:** `specs/027-<slug>/requirements.md`, `spec.md`, `design.md`, `tasks.md` (dla pracy wyłącznie organizacyjnej można uzasadnić pominięcie wybranych artefaktów).
- **Weryfikacja:** Powiązanie kryteriów akceptacji z testami, wyniki kontroli CI lub manualnych, przegląd zmian i aktualizacja `progress.md`.

### Lekcja 28 — Pokoje, zaproszenia, odliczanie i sesje meczów

- **Cel:** Zrozumieć i zastosować zagadnienie: pokoje, zaproszenia, odliczanie i sesje meczów.
- **Rezultat:** Zatwierdzona, ograniczona zakresem zmiana w kodzie, infrastrukturze lub dokumentacji, zgodna z tematem lekcji.
- **Artefakty SDD:** `specs/028-<slug>/requirements.md`, `spec.md`, `design.md`, `tasks.md` (dla pracy wyłącznie organizacyjnej można uzasadnić pominięcie wybranych artefaktów).
- **Weryfikacja:** Powiązanie kryteriów akceptacji z testami, wyniki kontroli CI lub manualnych, przegląd zmian i aktualizacja `progress.md`.

### Lekcja 29 — Linie karne, ataki, zwycięstwo i porażka

- **Cel:** Zrozumieć i zastosować zagadnienie: linie karne, ataki, zwycięstwo i porażka.
- **Rezultat:** Zatwierdzona, ograniczona zakresem zmiana w kodzie, infrastrukturze lub dokumentacji, zgodna z tematem lekcji.
- **Artefakty SDD:** `specs/029-<slug>/requirements.md`, `spec.md`, `design.md`, `tasks.md` (dla pracy wyłącznie organizacyjnej można uzasadnić pominięcie wybranych artefaktów).
- **Weryfikacja:** Powiązanie kryteriów akceptacji z testami, wyniki kontroli CI lub manualnych, przegląd zmian i aktualizacja `progress.md`.

### Lekcja 30 — Ponowne połączenie, snapshoty, predykcja i uzgadnianie stanu

- **Cel:** Zrozumieć i zastosować zagadnienie: ponowne połączenie, snapshoty, predykcja i uzgadnianie stanu.
- **Rezultat:** Zatwierdzona, ograniczona zakresem zmiana w kodzie, infrastrukturze lub dokumentacji, zgodna z tematem lekcji.
- **Artefakty SDD:** `specs/030-<slug>/requirements.md`, `spec.md`, `design.md`, `tasks.md` (dla pracy wyłącznie organizacyjnej można uzasadnić pominięcie wybranych artefaktów).
- **Weryfikacja:** Powiązanie kryteriów akceptacji z testami, wyniki kontroli CI lub manualnych, przegląd zmian i aktualizacja `progress.md`.

**Po module:** Przegląd przyrostu, otwartych ryzyk i zależności przed kolejnym modułem.

## Moduł 07: Matchmaking i funkcje rywalizacji

### Lekcja 31 — Redis, obecność graczy, kolejka matchmakingu i TTL

- **Cel:** Zrozumieć i zastosować zagadnienie: redis, obecność graczy, kolejka matchmakingu i ttl.
- **Rezultat:** Zatwierdzona, ograniczona zakresem zmiana w kodzie, infrastrukturze lub dokumentacji, zgodna z tematem lekcji.
- **Artefakty SDD:** `specs/031-<slug>/requirements.md`, `spec.md`, `design.md`, `tasks.md` (dla pracy wyłącznie organizacyjnej można uzasadnić pominięcie wybranych artefaktów).
- **Weryfikacja:** Powiązanie kryteriów akceptacji z testami, wyniki kontroli CI lub manualnych, przegląd zmian i aktualizacja `progress.md`.

### Lekcja 32 — System rankingowy, matchmaking rankingowy i uczciwość

- **Cel:** Zrozumieć i zastosować zagadnienie: system rankingowy, matchmaking rankingowy i uczciwość.
- **Rezultat:** Zatwierdzona, ograniczona zakresem zmiana w kodzie, infrastrukturze lub dokumentacji, zgodna z tematem lekcji.
- **Artefakty SDD:** `specs/032-<slug>/requirements.md`, `spec.md`, `design.md`, `tasks.md` (dla pracy wyłącznie organizacyjnej można uzasadnić pominięcie wybranych artefaktów).
- **Weryfikacja:** Powiązanie kryteriów akceptacji z testami, wyniki kontroli CI lub manualnych, przegląd zmian i aktualizacja `progress.md`.

### Lekcja 33 — Tablice wyników, rankingi i interfejs historii meczów

- **Cel:** Zrozumieć i zastosować zagadnienie: tablice wyników, rankingi i interfejs historii meczów.
- **Rezultat:** Zatwierdzona, ograniczona zakresem zmiana w kodzie, infrastrukturze lub dokumentacji, zgodna z tematem lekcji.
- **Artefakty SDD:** `specs/033-<slug>/requirements.md`, `spec.md`, `design.md`, `tasks.md` (dla pracy wyłącznie organizacyjnej można uzasadnić pominięcie wybranych artefaktów).
- **Weryfikacja:** Powiązanie kryteriów akceptacji z testami, wyniki kontroli CI lub manualnych, przegląd zmian i aktualizacja `progress.md`.

### Lekcja 34 — Tryb obserwatora i ograniczenia widoczności

- **Cel:** Zrozumieć i zastosować zagadnienie: tryb obserwatora i ograniczenia widoczności.
- **Rezultat:** Zatwierdzona, ograniczona zakresem zmiana w kodzie, infrastrukturze lub dokumentacji, zgodna z tematem lekcji.
- **Artefakty SDD:** `specs/034-<slug>/requirements.md`, `spec.md`, `design.md`, `tasks.md` (dla pracy wyłącznie organizacyjnej można uzasadnić pominięcie wybranych artefaktów).
- **Weryfikacja:** Powiązanie kryteriów akceptacji z testami, wyniki kontroli CI lub manualnych, przegląd zmian i aktualizacja `progress.md`.

### Lekcja 35 — Dziennik zdarzeń, replay i weryfikacja determinizmu

- **Cel:** Zrozumieć i zastosować zagadnienie: dziennik zdarzeń, replay i weryfikacja determinizmu.
- **Rezultat:** Zatwierdzona, ograniczona zakresem zmiana w kodzie, infrastrukturze lub dokumentacji, zgodna z tematem lekcji.
- **Artefakty SDD:** `specs/035-<slug>/requirements.md`, `spec.md`, `design.md`, `tasks.md` (dla pracy wyłącznie organizacyjnej można uzasadnić pominięcie wybranych artefaktów).
- **Weryfikacja:** Powiązanie kryteriów akceptacji z testami, wyniki kontroli CI lub manualnych, przegląd zmian i aktualizacja `progress.md`.

**Po module:** Przegląd przyrostu, otwartych ryzyk i zależności przed kolejnym modułem.

## Moduł 08: Infrastruktura AWS i Terraform

### Lekcja 36 — Architektura AWS, IAM, bezpieczeństwo i koszty

- **Cel:** Zrozumieć i zastosować zagadnienie: architektura aws, iam, bezpieczeństwo i koszty.
- **Rezultat:** Zatwierdzona, ograniczona zakresem zmiana w kodzie, infrastrukturze lub dokumentacji, zgodna z tematem lekcji.
- **Artefakty SDD:** `specs/036-<slug>/requirements.md`, `spec.md`, `design.md`, `tasks.md` (dla pracy wyłącznie organizacyjnej można uzasadnić pominięcie wybranych artefaktów).
- **Weryfikacja:** Powiązanie kryteriów akceptacji z testami, wyniki kontroli CI lub manualnych, przegląd zmian i aktualizacja `progress.md`.

### Lekcja 37 — Moduły Terraform, zdalny stan i środowiska

- **Cel:** Zrozumieć i zastosować zagadnienie: moduły terraform, zdalny stan i środowiska.
- **Rezultat:** Zatwierdzona, ograniczona zakresem zmiana w kodzie, infrastrukturze lub dokumentacji, zgodna z tematem lekcji.
- **Artefakty SDD:** `specs/037-<slug>/requirements.md`, `spec.md`, `design.md`, `tasks.md` (dla pracy wyłącznie organizacyjnej można uzasadnić pominięcie wybranych artefaktów).
- **Weryfikacja:** Powiązanie kryteriów akceptacji z testami, wyniki kontroli CI lub manualnych, przegląd zmian i aktualizacja `progress.md`.

### Lekcja 38 — VPC, sieć, grupy bezpieczeństwa i ALB

- **Cel:** Zrozumieć i zastosować zagadnienie: vpc, sieć, grupy bezpieczeństwa i alb.
- **Rezultat:** Zatwierdzona, ograniczona zakresem zmiana w kodzie, infrastrukturze lub dokumentacji, zgodna z tematem lekcji.
- **Artefakty SDD:** `specs/038-<slug>/requirements.md`, `spec.md`, `design.md`, `tasks.md` (dla pracy wyłącznie organizacyjnej można uzasadnić pominięcie wybranych artefaktów).
- **Weryfikacja:** Powiązanie kryteriów akceptacji z testami, wyniki kontroli CI lub manualnych, przegląd zmian i aktualizacja `progress.md`.

### Lekcja 39 — ECS Fargate, ECR, RDS i ElastiCache

- **Cel:** Zrozumieć i zastosować zagadnienie: ecs fargate, ecr, rds i elasticache.
- **Rezultat:** Zatwierdzona, ograniczona zakresem zmiana w kodzie, infrastrukturze lub dokumentacji, zgodna z tematem lekcji.
- **Artefakty SDD:** `specs/039-<slug>/requirements.md`, `spec.md`, `design.md`, `tasks.md` (dla pracy wyłącznie organizacyjnej można uzasadnić pominięcie wybranych artefaktów).
- **Weryfikacja:** Powiązanie kryteriów akceptacji z testami, wyniki kontroli CI lub manualnych, przegląd zmian i aktualizacja `progress.md`.

### Lekcja 40 — S3, CloudFront, Route 53, TLS i sekrety

- **Cel:** Zrozumieć i zastosować zagadnienie: s3, cloudfront, route 53, tls i sekrety.
- **Rezultat:** Zatwierdzona, ograniczona zakresem zmiana w kodzie, infrastrukturze lub dokumentacji, zgodna z tematem lekcji.
- **Artefakty SDD:** `specs/040-<slug>/requirements.md`, `spec.md`, `design.md`, `tasks.md` (dla pracy wyłącznie organizacyjnej można uzasadnić pominięcie wybranych artefaktów).
- **Weryfikacja:** Powiązanie kryteriów akceptacji z testami, wyniki kontroli CI lub manualnych, przegląd zmian i aktualizacja `progress.md`.

**Po module:** Przegląd przyrostu, otwartych ryzyk i zależności przed kolejnym modułem.

## Moduł 09: GitHub Actions i dostarczanie zmian

### Lekcja 41 — Pipeline CI, cache i strategia testów

- **Cel:** Zrozumieć i zastosować zagadnienie: pipeline ci, cache i strategia testów.
- **Rezultat:** Zatwierdzona, ograniczona zakresem zmiana w kodzie, infrastrukturze lub dokumentacji, zgodna z tematem lekcji.
- **Artefakty SDD:** `specs/041-<slug>/requirements.md`, `spec.md`, `design.md`, `tasks.md` (dla pracy wyłącznie organizacyjnej można uzasadnić pominięcie wybranych artefaktów).
- **Weryfikacja:** Powiązanie kryteriów akceptacji z testami, wyniki kontroli CI lub manualnych, przegląd zmian i aktualizacja `progress.md`.

### Lekcja 42 — Budowanie obrazów Docker, skanowanie i publikacja do ECR

- **Cel:** Zrozumieć i zastosować zagadnienie: budowanie obrazów docker, skanowanie i publikacja do ecr.
- **Rezultat:** Zatwierdzona, ograniczona zakresem zmiana w kodzie, infrastrukturze lub dokumentacji, zgodna z tematem lekcji.
- **Artefakty SDD:** `specs/042-<slug>/requirements.md`, `spec.md`, `design.md`, `tasks.md` (dla pracy wyłącznie organizacyjnej można uzasadnić pominięcie wybranych artefaktów).
- **Weryfikacja:** Powiązanie kryteriów akceptacji z testami, wyniki kontroli CI lub manualnych, przegląd zmian i aktualizacja `progress.md`.

### Lekcja 43 — Wdrożenie beta, OIDC i migracje bazy

- **Cel:** Zrozumieć i zastosować zagadnienie: wdrożenie beta, oidc i migracje bazy.
- **Rezultat:** Zatwierdzona, ograniczona zakresem zmiana w kodzie, infrastrukturze lub dokumentacji, zgodna z tematem lekcji.
- **Artefakty SDD:** `specs/043-<slug>/requirements.md`, `spec.md`, `design.md`, `tasks.md` (dla pracy wyłącznie organizacyjnej można uzasadnić pominięcie wybranych artefaktów).
- **Weryfikacja:** Powiązanie kryteriów akceptacji z testami, wyniki kontroli CI lub manualnych, przegląd zmian i aktualizacja `progress.md`.

### Lekcja 44 — Zatwierdzanie produkcji, wydania i wycofywanie zmian

- **Cel:** Zrozumieć i zastosować zagadnienie: zatwierdzanie produkcji, wydania i wycofywanie zmian.
- **Rezultat:** Zatwierdzona, ograniczona zakresem zmiana w kodzie, infrastrukturze lub dokumentacji, zgodna z tematem lekcji.
- **Artefakty SDD:** `specs/044-<slug>/requirements.md`, `spec.md`, `design.md`, `tasks.md` (dla pracy wyłącznie organizacyjnej można uzasadnić pominięcie wybranych artefaktów).
- **Weryfikacja:** Powiązanie kryteriów akceptacji z testami, wyniki kontroli CI lub manualnych, przegląd zmian i aktualizacja `progress.md`.

### Lekcja 45 — Smoke testy, tagi wydań i weryfikacja wdrożeń

- **Cel:** Zrozumieć i zastosować zagadnienie: smoke testy, tagi wydań i weryfikacja wdrożeń.
- **Rezultat:** Zatwierdzona, ograniczona zakresem zmiana w kodzie, infrastrukturze lub dokumentacji, zgodna z tematem lekcji.
- **Artefakty SDD:** `specs/045-<slug>/requirements.md`, `spec.md`, `design.md`, `tasks.md` (dla pracy wyłącznie organizacyjnej można uzasadnić pominięcie wybranych artefaktów).
- **Weryfikacja:** Powiązanie kryteriów akceptacji z testami, wyniki kontroli CI lub manualnych, przegląd zmian i aktualizacja `progress.md`.

**Po module:** Przegląd przyrostu, otwartych ryzyk i zależności przed kolejnym modułem.

## Moduł 10: Obserwowalność i niezawodność

### Lekcja 46 — SLI, SLO oraz metryki RED i USE

- **Cel:** Zrozumieć i zastosować zagadnienie: sli, slo oraz metryki red i use.
- **Rezultat:** Zatwierdzona, ograniczona zakresem zmiana w kodzie, infrastrukturze lub dokumentacji, zgodna z tematem lekcji.
- **Artefakty SDD:** `specs/046-<slug>/requirements.md`, `spec.md`, `design.md`, `tasks.md` (dla pracy wyłącznie organizacyjnej można uzasadnić pominięcie wybranych artefaktów).
- **Weryfikacja:** Powiązanie kryteriów akceptacji z testami, wyniki kontroli CI lub manualnych, przegląd zmian i aktualizacja `progress.md`.

### Lekcja 47 — Instrumentacja OpenTelemetry i śledzenie rozproszone

- **Cel:** Zrozumieć i zastosować zagadnienie: instrumentacja opentelemetry i śledzenie rozproszone.
- **Rezultat:** Zatwierdzona, ograniczona zakresem zmiana w kodzie, infrastrukturze lub dokumentacji, zgodna z tematem lekcji.
- **Artefakty SDD:** `specs/047-<slug>/requirements.md`, `spec.md`, `design.md`, `tasks.md` (dla pracy wyłącznie organizacyjnej można uzasadnić pominięcie wybranych artefaktów).
- **Weryfikacja:** Powiązanie kryteriów akceptacji z testami, wyniki kontroli CI lub manualnych, przegląd zmian i aktualizacja `progress.md`.

### Lekcja 48 — Metryki zgodne z Prometheusem, Grafana i dashboardy

- **Cel:** Zrozumieć i zastosować zagadnienie: metryki zgodne z prometheusem, grafana i dashboardy.
- **Rezultat:** Zatwierdzona, ograniczona zakresem zmiana w kodzie, infrastrukturze lub dokumentacji, zgodna z tematem lekcji.
- **Artefakty SDD:** `specs/048-<slug>/requirements.md`, `spec.md`, `design.md`, `tasks.md` (dla pracy wyłącznie organizacyjnej można uzasadnić pominięcie wybranych artefaktów).
- **Weryfikacja:** Powiązanie kryteriów akceptacji z testami, wyniki kontroli CI lub manualnych, przegląd zmian i aktualizacja `progress.md`.

### Lekcja 49 — Logi strukturalne, alerty i reagowanie na incydenty

- **Cel:** Zrozumieć i zastosować zagadnienie: logi strukturalne, alerty i reagowanie na incydenty.
- **Rezultat:** Zatwierdzona, ograniczona zakresem zmiana w kodzie, infrastrukturze lub dokumentacji, zgodna z tematem lekcji.
- **Artefakty SDD:** `specs/049-<slug>/requirements.md`, `spec.md`, `design.md`, `tasks.md` (dla pracy wyłącznie organizacyjnej można uzasadnić pominięcie wybranych artefaktów).
- **Weryfikacja:** Powiązanie kryteriów akceptacji z testami, wyniki kontroli CI lub manualnych, przegląd zmian i aktualizacja `progress.md`.

### Lekcja 50 — Testy obciążeniowe, planowanie pojemności i eksperymenty awaryjne

- **Cel:** Zrozumieć i zastosować zagadnienie: testy obciążeniowe, planowanie pojemności i eksperymenty awaryjne.
- **Rezultat:** Zatwierdzona, ograniczona zakresem zmiana w kodzie, infrastrukturze lub dokumentacji, zgodna z tematem lekcji.
- **Artefakty SDD:** `specs/050-<slug>/requirements.md`, `spec.md`, `design.md`, `tasks.md` (dla pracy wyłącznie organizacyjnej można uzasadnić pominięcie wybranych artefaktów).
- **Weryfikacja:** Powiązanie kryteriów akceptacji z testami, wyniki kontroli CI lub manualnych, przegląd zmian i aktualizacja `progress.md`.

**Po module:** Przegląd przyrostu, otwartych ryzyk i zależności przed kolejnym modułem.

## Moduł 11: Bezpieczeństwo, wydajność i skalowanie

### Lekcja 51 — Modelowanie zagrożeń, OWASP i bezpieczeństwo WebSocket

- **Cel:** Zrozumieć i zastosować zagadnienie: modelowanie zagrożeń, owasp i bezpieczeństwo websocket.
- **Rezultat:** Zatwierdzona, ograniczona zakresem zmiana w kodzie, infrastrukturze lub dokumentacji, zgodna z tematem lekcji.
- **Artefakty SDD:** `specs/051-<slug>/requirements.md`, `spec.md`, `design.md`, `tasks.md` (dla pracy wyłącznie organizacyjnej można uzasadnić pominięcie wybranych artefaktów).
- **Weryfikacja:** Powiązanie kryteriów akceptacji z testami, wyniki kontroli CI lub manualnych, przegląd zmian i aktualizacja `progress.md`.

### Lekcja 52 — Anti-cheat, ograniczanie ruchu i przeciwdziałanie nadużyciom

- **Cel:** Zrozumieć i zastosować zagadnienie: anti-cheat, ograniczanie ruchu i przeciwdziałanie nadużyciom.
- **Rezultat:** Zatwierdzona, ograniczona zakresem zmiana w kodzie, infrastrukturze lub dokumentacji, zgodna z tematem lekcji.
- **Artefakty SDD:** `specs/052-<slug>/requirements.md`, `spec.md`, `design.md`, `tasks.md` (dla pracy wyłącznie organizacyjnej można uzasadnić pominięcie wybranych artefaktów).
- **Weryfikacja:** Powiązanie kryteriów akceptacji z testami, wyniki kontroli CI lub manualnych, przegląd zmian i aktualizacja `progress.md`.

### Lekcja 53 — Profilowanie pętli gry, wydajność klienta i opóźnienia

- **Cel:** Zrozumieć i zastosować zagadnienie: profilowanie pętli gry, wydajność klienta i opóźnienia.
- **Rezultat:** Zatwierdzona, ograniczona zakresem zmiana w kodzie, infrastrukturze lub dokumentacji, zgodna z tematem lekcji.
- **Artefakty SDD:** `specs/053-<slug>/requirements.md`, `spec.md`, `design.md`, `tasks.md` (dla pracy wyłącznie organizacyjnej można uzasadnić pominięcie wybranych artefaktów).
- **Weryfikacja:** Powiązanie kryteriów akceptacji z testami, wyniki kontroli CI lub manualnych, przegląd zmian i aktualizacja `progress.md`.

### Lekcja 54 — Skalowanie poziome, własność sesji i routing rozproszony

- **Cel:** Zrozumieć i zastosować zagadnienie: skalowanie poziome, własność sesji i routing rozproszony.
- **Rezultat:** Zatwierdzona, ograniczona zakresem zmiana w kodzie, infrastrukturze lub dokumentacji, zgodna z tematem lekcji.
- **Artefakty SDD:** `specs/054-<slug>/requirements.md`, `spec.md`, `design.md`, `tasks.md` (dla pracy wyłącznie organizacyjnej można uzasadnić pominięcie wybranych artefaktów).
- **Weryfikacja:** Powiązanie kryteriów akceptacji z testami, wyniki kontroli CI lub manualnych, przegląd zmian i aktualizacja `progress.md`.

### Lekcja 55 — Odporność, graceful shutdown i odtwarzanie po awarii

- **Cel:** Zrozumieć i zastosować zagadnienie: odporność, graceful shutdown i odtwarzanie po awarii.
- **Rezultat:** Zatwierdzona, ograniczona zakresem zmiana w kodzie, infrastrukturze lub dokumentacji, zgodna z tematem lekcji.
- **Artefakty SDD:** `specs/055-<slug>/requirements.md`, `spec.md`, `design.md`, `tasks.md` (dla pracy wyłącznie organizacyjnej można uzasadnić pominięcie wybranych artefaktów).
- **Weryfikacja:** Powiązanie kryteriów akceptacji z testami, wyniki kontroli CI lub manualnych, przegląd zmian i aktualizacja `progress.md`.

**Po module:** Przegląd przyrostu, otwartych ryzyk i zależności przed kolejnym modułem.

## Moduł 12: Gotowość produkcyjna i przegląd końcowy

### Lekcja 56 — Przegląd architektury i refaktoryzacja

- **Cel:** Zrozumieć i zastosować zagadnienie: przegląd architektury i refaktoryzacja.
- **Rezultat:** Zatwierdzona, ograniczona zakresem zmiana w kodzie, infrastrukturze lub dokumentacji, zgodna z tematem lekcji.
- **Artefakty SDD:** `specs/056-<slug>/requirements.md`, `spec.md`, `design.md`, `tasks.md` (dla pracy wyłącznie organizacyjnej można uzasadnić pominięcie wybranych artefaktów).
- **Weryfikacja:** Powiązanie kryteriów akceptacji z testami, wyniki kontroli CI lub manualnych, przegląd zmian i aktualizacja `progress.md`.

### Lekcja 57 — Pokrycie testami, audyt dostępności i bezpieczeństwa

- **Cel:** Zrozumieć i zastosować zagadnienie: pokrycie testami, audyt dostępności i bezpieczeństwa.
- **Rezultat:** Zatwierdzona, ograniczona zakresem zmiana w kodzie, infrastrukturze lub dokumentacji, zgodna z tematem lekcji.
- **Artefakty SDD:** `specs/057-<slug>/requirements.md`, `spec.md`, `design.md`, `tasks.md` (dla pracy wyłącznie organizacyjnej można uzasadnić pominięcie wybranych artefaktów).
- **Weryfikacja:** Powiązanie kryteriów akceptacji z testami, wyniki kontroli CI lub manualnych, przegląd zmian i aktualizacja `progress.md`.

### Lekcja 58 — Testy beta z graczami, telemetria i priorytetyzacja błędów

- **Cel:** Zrozumieć i zastosować zagadnienie: testy beta z graczami, telemetria i priorytetyzacja błędów.
- **Rezultat:** Zatwierdzona, ograniczona zakresem zmiana w kodzie, infrastrukturze lub dokumentacji, zgodna z tematem lekcji.
- **Artefakty SDD:** `specs/058-<slug>/requirements.md`, `spec.md`, `design.md`, `tasks.md` (dla pracy wyłącznie organizacyjnej można uzasadnić pominięcie wybranych artefaktów).
- **Weryfikacja:** Powiązanie kryteriów akceptacji z testami, wyniki kontroli CI lub manualnych, przegląd zmian i aktualizacja `progress.md`.

### Lekcja 59 — Lista gotowości produkcyjnej i uruchomienie

- **Cel:** Zrozumieć i zastosować zagadnienie: lista gotowości produkcyjnej i uruchomienie.
- **Rezultat:** Zatwierdzona, ograniczona zakresem zmiana w kodzie, infrastrukturze lub dokumentacji, zgodna z tematem lekcji.
- **Artefakty SDD:** `specs/059-<slug>/requirements.md`, `spec.md`, `design.md`, `tasks.md` (dla pracy wyłącznie organizacyjnej można uzasadnić pominięcie wybranych artefaktów).
- **Weryfikacja:** Powiązanie kryteriów akceptacji z testami, wyniki kontroli CI lub manualnych, przegląd zmian i aktualizacja `progress.md`.

### Lekcja 60 — Egzamin końcowy, dokumentacja i roadmapa v2

- **Cel:** Zrozumieć i zastosować zagadnienie: egzamin końcowy, dokumentacja i roadmapa v2.
- **Rezultat:** Zatwierdzona, ograniczona zakresem zmiana w kodzie, infrastrukturze lub dokumentacji, zgodna z tematem lekcji.
- **Artefakty SDD:** `specs/060-<slug>/requirements.md`, `spec.md`, `design.md`, `tasks.md` (dla pracy wyłącznie organizacyjnej można uzasadnić pominięcie wybranych artefaktów).
- **Weryfikacja:** Powiązanie kryteriów akceptacji z testami, wyniki kontroli CI lub manualnych, przegląd zmian i aktualizacja `progress.md`.

**Po module:** Przegląd przyrostu, otwartych ryzyk i zależności przed kolejnym modułem.
