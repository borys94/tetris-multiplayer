# Requirements — Lesson 005: CI Quality Gates

**Status:** Draft  
**Specification:** [spec.md](./spec.md)

## Cel
Zapewnić powtarzalną, bezpieczną i czytelną weryfikację jakości kodu oraz dokumentacji dla Pull Requestów do `main`.

## Zakres
GitHub Actions, lint TypeScript w `apps/web`, `apps/server`, `packages/game-engine`, lint Markdown, istniejące Yarn constraints, typecheck, Vitest i build; raportowanie wyników i weryfikacja ochrony gałęzi. Zmiany istniejącej dokumentacji wymagają wcześniejszego audytu i zatwierdzenia zakresu.

## Wymagania
- **REQ-001 — Kontrole PR:** Każde otwarcie, ponowne otwarcie i aktualizacja PR do `main` uruchamia kontrolę lint TypeScript, lint Markdown, constraints, typecheck, test i build.
- **REQ-002 — Powtarzalność:** Kontrole korzystają z jawnie określonych wersji środowiska wykonawczego i menedżera pakietów oraz instalują zależności zgodnie z zatwierdzonym lockfile, bez jego modyfikacji.
- **REQ-003 — Poprawność grafu i cache:** Zmiany w pakietach współdzielonych oraz wejściach wpływających na kontrole muszą powodować odpowiednią ponowną weryfikację zależnych workspace'ów. Ponowne wykorzystanie wyniku z cache jest dopuszczalne tylko dla równoważnych wejść zadania.
- **REQ-004 — Bezpieczeństwo:** Workflow używa minimalnych uprawnień, nie wymaga sekretów i nie uruchamia niezaufanego kodu w uprzywilejowanym kontekście.
- **REQ-005 — Diagnostyka i kontrola merge:** Wyniki obowiązkowych kontroli jakości muszą być widoczne w Pull Request. Nieudana obowiązkowa kontrola musi uniemożliwiać merge do `main` poprzez mechanizm wymaganych status checks.

## Kryteria akceptacji
Zmiana jest zakończona, gdy AC-001–AC-006 ze [spec.md](./spec.md) mają udokumentowany wynik `PASS`, a PR przeszedł review. `NOT_RUN`/`BLOCKED` oznacza niespełniony warunek zakończenia; ewentualna zmiana zakresu wymaga odrębnej decyzji właściciela.

## Poza zakresem
- Deployment, publikowanie artefaktów i sekrety AWS.
- Selekcja wyłącznie zmienionych workspace'ów i zdalny cache Turborepo.
- Egzekwowanie docelowego czasu CI jako twardej bramki; mierzymy czas, cel p95 ≤ 5 minut pozostaje propozycją do walidacji.
- Masowe formatowanie zatwierdzonych specyfikacji bez osobnej zgody.
