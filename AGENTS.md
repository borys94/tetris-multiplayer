# AGENTS.md — Multiplayer Tetris — SDD Engineering Lab

## Repozytorium i źródło prawdy

- Repozytorium GitHub: <https://github.com/borys94/tetris-multiplayer>
- Domyślna gałąź: `main`.
- Kod, specyfikacje i dokumentacja w repozytorium stanowią źródło prawdy. Przed pracą sprawdź aktualne pliki i nie zakładaj, że plan odpowiada stanowi implementacji.
- Plan kursu: `syllabus.md`; postępy: `progress.md`; specyfikacje funkcjonalności: `specs/`.
- Każda lekcja odbywa się w osobnym czacie ChatGPT i dostarcza mały, testowalny przyrost aplikacji.

## Uzgodniony stack

- Frontend: React, TypeScript, Vite, Canvas 2D.
- Backend: Node.js, **Express.js**, WebSocket (`ws`).
- Monorepo: **Yarn Workspaces** i Turborepo.
- Silnik gry: czysty, deterministyczny TypeScript niezależny od UI i infrastruktury.
- Dane: PostgreSQL + Drizzle; Redis do funkcji wymagających stanu tymczasowego.
- Testy: Vitest i Playwright.
- Infrastruktura: AWS, Terraform, ECS Fargate; środowiska `beta` i `production`.
- CI/CD: GitHub Actions.
- Observability: OpenTelemetry, Prometheus-compatible metrics, Grafana; logi i tracing.
- AI: ChatGPT jako mentor/architekt/reviewer, Claude Code jako agent implementacyjny.

## Metoda pracy: Spec-Driven Development

1. Zdefiniuj cel, wymagania, kryteria akceptacji i przypadki brzegowe.
2. Przygotuj lub zaktualizuj specyfikację w `specs/`.
3. Ustal projekt techniczny, kontrakty i decyzje architektoniczne; dokumentuj ważne decyzje w ADR.
4. Podziel pracę na małe zadania; zatwierdź zakres przed implementacją.
5. Implementuj tylko zatwierdzony zakres; nie dodawaj niezamówionych funkcjonalności.
   - Bez osobnej zgody: poprawki błędów i literówek, lokalny refactor oraz testy w zatwierdzonym zakresie, jeśli nie zmieniają kontraktów, wymagań ani decyzji architektonicznych; opisz je w raporcie.
   - Zmiana poza zakresem: zatrzymaj się i przedstaw propozycję (problem, warianty, kompromisy, ryzyka, wpływ na pliki i testy); po zgodzie najpierw zaktualizuj SDD. Gdy klasyfikacja jest niejasna — pytaj.
6. Uruchom adekwatne testy, lint i typecheck; nie deklaruj sukcesu bez wyników.
7. Wykonaj code review, przygotuj PR i zaktualizuj `progress.md` dopiero po weryfikacji.

## Zasady architektury

- Na początku preferuj modularny monolit zamiast mikroserwisów.
- Multiplayer ma być server-authoritative; klient wysyła akcje, a nie arbitralny stan meczu.
- Separuj domenę od Reacta, Expressa, WebSocketów, bazy i AWS.
- Stosuj SOLID, Clean Architecture, DDD i wzorce projektowe pragmatycznie, bez zbędnych abstrakcji.
- Używaj współdzielonych, walidowanych kontraktów (np. Zod).
- Projektuj z uwzględnieniem bezpieczeństwa, dostępności, wydajności, reconnect i obserwowalności.

## GitHub i bezpieczeństwo zmian

- Preferuj osobne gałęzie `feature/NNN-krotki-opis` i pull requesty.
- Nie wykonuj merge, wdrożeń produkcyjnych, zmian sekretów ani destrukcyjnych operacji bez wyraźnej zgody.
- Przed zmianą istniejącego pliku odczytaj jego aktualną zawartość; nie nadpisuj pracy użytkownika.
- Deployment na `beta` po merge do `main`; produkcja przez zatwierdzany release workflow, gdy zostaną skonfigurowane.
- Sekrety poza repozytorium; dla AWS preferuj GitHub OIDC i role IAM.

## Język i poziom

- Komunikacja, dokumentacja i opisy lekcji: **po polsku**.
- Kod, identyfikatory, nazwy API, plików i standardowe terminy techniczne: po angielsku.
- Poziom: doświadczony programista JavaScript/TypeScript; nacisk na decyzje architektoniczne i trade-offy.
