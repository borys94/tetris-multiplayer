# T-05 — Lokalna kontrola korekt redakcyjnych (2026-11-13)

- Zakres: M-01, M-02, m-01; M-03 i G0 pozostają `BLOCKED`.
- Zatwierdzenia czterech dokumentów: w rozmowie L02; brak autoryzacji zapisu do GitHub.
- Zachowano wersję 0.2 i ID `002-ai-workflow`.
- Zmieniono metadane statusów, historyczne odniesienia i oznaczenia stanu planu. Nie zmieniano AC, scenariuszy, zakresu ani obowiązków.
- Raporty T-01–T-04 zaakceptowane lokalnie; T-05/G6 nieukończone.
- Kontrola: porównanie tekstów i walidacja struktury, bez uruchamiania testów aplikacji/CI.

## Diff

```diff
--- requirements-v0.2.md
+++ requirements.md
@@ -2,7 +2,7 @@
 
 - **ID:** `002-ai-workflow`
 - **Wersja:** 0.2
-- **Status:** Draft — do ponownego review właściciela; niezatwierdzony
+- **Status:** Approved — zatwierdzono przez właściciela w rozmowie L02 (2026-11-13); zapis do GitHub nieautoryzowany
 - **Podstawa:** `syllabus.md` (L02), `progress.md` (`main`, odczyt 2026-11-13), zatwierdzony pakiet SDD L01, zatwierdzenie ogólnego workflow w rozmowie L02, review `requirements.md` v0.1 i akceptacja wszystkich siedmiu uwag.
 - **Charakter:** organizacja pracy i dokumentacja; bez implementacji aplikacji, CI ani infrastruktury.
 
@@ -55,7 +55,7 @@
 ### 6.1 Fakty
 
 - Test diagnostyczny przeprowadzono **2026-11-13** w rozmowie L02: **10 pytań, 10 poprawnych odpowiedzi, 20/20 punktów**. Zakres: walidacja runtime w TypeScript, deterministyczność, autorytatywny serwer, testy, kryteria akceptacji, separacja silnika, idempotencja, CI, SDD, kontrola zakresu AI. Interpretacja: poprawna znajomość sprawdzanych zasad. Ograniczenia: pytania zamknięte, odpowiedzi własne uczestnika, brak niezależnej oceny umiejętności praktycznych.
-- Właściciel zatwierdził **ogólny workflow**; nie zatwierdził jeszcze treści pakietu SDD L02.
+- Właściciel zatwierdził **ogólny workflow** oraz wszystkie cztery dokumenty SDD L02 v0.2 w rozmowie; zatwierdzenie nie stanowi zgody na zapis do GitHub.
 - `progress.md` na `main` wskazywał 1/60 i L02 „Nie rozpoczęto” podczas wcześniejszego odczytu. Rozpoczęcie pracy w rozmowie nie jest jeszcze aktualizacją repozytorium. Przed operacjami zależnymi od aktualnego stanu należy ponowić weryfikację zgodnie z FR-02.
 
 ### 6.2 Rejestr decyzji procesowych
@@ -64,14 +64,14 @@
 |---|---|---|
 | D-02-01 | GitHub jest wersjonowanym źródłem prawdy; lokalna kopia nie zastępuje odczytu repozytorium | Zatwierdzona jako część ogólnego workflow |
 | D-02-02 | Człowiek podejmuje ostateczne decyzje i zatwierdza zakres | Zatwierdzona jako część ogólnego workflow |
-| D-02-03 | Implementacja wymaga uprzedniego zatwierdzenia SDD i zadań; zmiana zakresu wymaga ponownej akceptacji | Proponowane doprecyzowanie w v0.2 — do zatwierdzenia |
-| D-02-04 | Szczegółowe dowody przechowujemy w katalogu lekcji, a w `progress.md` umieszczamy status i odnośniki | Propozycja do zatwierdzenia |
+| D-02-03 | Implementacja wymaga uprzedniego zatwierdzenia SDD i zadań; zmiana zakresu wymaga ponownej akceptacji | Zatwierdzona w rozmowie L02 (v0.2) |
+| D-02-04 | Szczegółowe dowody przechowujemy w katalogu lekcji, a w `progress.md` umieszczamy status i odnośniki | Zatwierdzona w rozmowie L02 (v0.2) |
 
 ### 6.3 Lokalizacja dowodów
 
-**Proponowana konwencja:** szczegółowy raport diagnostyczny oraz raporty review umieszcza się w `specs/002-ai-workflow/evidence/` po zatwierdzeniu zakresu zadań; `progress.md` zawiera zwięzły stan, identyfikatory dowodów i odnośniki do plików/commitów. Nie tworzymy fikcyjnych plików dowodowych ani nie oznaczamy ich jako istniejące przed zapisem w repozytorium.
+**Zatwierdzona konwencja:** szczegółowy raport diagnostyczny oraz raporty review umieszcza się w `specs/002-ai-workflow/evidence/` po zatwierdzeniu zakresu zadań; `progress.md` zawiera zwięzły stan, identyfikatory dowodów i odnośniki do plików/commitów. Nie tworzymy fikcyjnych plików dowodowych ani nie oznaczamy ich jako istniejące przed zapisem w repozytorium.
 
-### 6.4 Otwarte kwestie do review
+### 6.4 Status review i dalsze kroki
 
-- Zatwierdzenie treści `requirements.md` v0.2, w tym bramki dla `tasks.md` i proponowanej konwencji dowodów.
-- Uzgodnienie szczegółów scenariuszy kontrolnych i macierzy AC ↔ zadania w `spec.md` oraz `tasks.md`.
+- Zatwierdzono w rozmowie treść `requirements.md`, `spec.md`, `design.md` i `tasks.md` v0.2, w tym bramki oraz konwencję dowodów.
+- Lokalny pre-review T-05 wykazał potrzebę synchronizacji metadanych; G0 i weryfikacja na GitHub pozostają `BLOCKED`.
--- spec-v0.2.md
+++ spec.md
@@ -2,8 +2,8 @@
 
 - **ID:** `002-ai-workflow`
 - **Wersja:** 0.2
-- **Status:** Draft — do ponownego review właściciela; niezatwierdzony
-- **Podstawa:** `requirements.md` v0.2 (zatwierdzony przez właściciela w rozmowie L02; status w treści lokalnego pliku i zapis GitHub wymagają synchronizacji). `tasks.md` v0.1 oraz `design.md` v0.1 pozostają Draft.
+- **Status:** Approved — zatwierdzono przez właściciela w rozmowie L02 (2026-11-13); zapis do GitHub nieautoryzowany
+- **Podstawa:** `requirements.md`, `design.md` i `tasks.md` v0.2 — zatwierdzone przez właściciela w rozmowie L02; lokalne metadane synchronizowane redakcyjnie, bez zapisu do GitHub.
 - **Charakter weryfikacji:** scenariusze manualne i review dokumentów; bez testów aplikacji ani CI.
 
 ## 1. Kryteria akceptacji
@@ -85,7 +85,7 @@
 
 ## 4. Macierz śledzenia
 
-| Kryterium | Wymagania | Zadania (planowane; `tasks.md` wymaga aktualizacji) | Metoda |
+| Kryterium | Wymagania | Zadania (`tasks.md` v0.2 — zatwierdzone) | Metoda |
 |---|---|---|---|
 | AC-01 | FR-01 | T-01 | Raport diagnostyczny i review |
 | AC-02 | FR-03, FR-04 | T-02 | Review ról i bramek |
@@ -95,7 +95,7 @@
 | AC-06 | FR-02, FR-07, FR-10, NFR-02 | T-05 | Review SDD, S-05, S-08, Git |
 | AC-07 | FR-09 | T-06 | S-06, decyzja, dowód Git |
 
-**Wymagania przekrojowe:** NFR-04 jest weryfikowane przez S-07 i S-10A–S-10C w ramach planowanego T-04; NFR-05 przez dokumentacyjny charakter L02 i przegląd T-05. Aktualna wersja `tasks.md` v0.1 nie wymienia wszystkich nowych scenariuszy: jej zakres i macierz trzeba zaktualizować podczas review `tasks.md`, przed zatwierdzeniem pakietu.
+**Wymagania przekrojowe:** NFR-04 jest weryfikowane przez S-07 i S-10A–S-10C w ramach planowanego T-04; NFR-05 przez dokumentacyjny charakter L02 i przegląd T-05. Zatwierdzone `tasks.md` v0.2 przypisuje wszystkie wymagane scenariusze do T-04 i T-05.
 
 ## 5. Granice i bramki ukończenia
 
--- design-v0.2.md
+++ design.md
@@ -2,8 +2,8 @@
 
 - **ID:** `002-ai-workflow`
 - **Wersja:** 0.2
-- **Status:** Draft — do ponownego review właściciela; niezatwierdzony
-- **Podstawa:** `requirements.md` v0.2 i `spec.md` v0.2 (zatwierdzone przez właściciela w rozmowie L02; lokalne metadane wymagają synchronizacji przed zapisem w GitHub); `design.md` v0.1 i zaakceptowane 8 uwag review.
+- **Status:** Approved — zatwierdzono przez właściciela w rozmowie L02 (2026-11-13); zapis do GitHub nieautoryzowany
+- **Podstawa:** `requirements.md`, `spec.md` i `tasks.md` v0.2 — zatwierdzone przez właściciela w rozmowie L02; historia review `design.md` v0.1 i 8 zaakceptowanych uwag. Zapis do GitHub wymaga odrębnej zgody.
 - **Zakres:** organizacja współpracy AI i weryfikacja dokumentacyjna L02; bez kodu aplikacji, CI i infrastruktury.
 
 ## 1. Przepływ i odpowiedzialność
@@ -123,8 +123,8 @@
 | AC-06 | G0, G5, G6, śledzenie AC ↔ T, SHA | S-05, S-08, review dokumentów i Git |
 | AC-07 | G7, decyzja właściciela, commit `progress.md` | S-06 i raport zamknięcia |
 
-Wymagania przekrojowe: `NFR-04` — S-07 i S-10A–C; `NFR-05` — manualny, dokumentacyjny charakter L02. `tasks.md` v0.1 wymaga aktualizacji podczas osobnego review, aby uwzględnić wszystkie nowe scenariusze.
+Wymagania przekrojowe: `NFR-04` — S-07 i S-10A–C; `NFR-05` — manualny, dokumentacyjny charakter L02. `tasks.md` v0.2 uwzględnia wszystkie wymagane scenariusze i zostało zatwierdzone w rozmowie L02.
 
 ## 8. Odroczenia i status
 
-Monorepo — L03; formalne szablony ADR — L04; CI i branch protection — L05. Nie wykonano testów aplikacji ani CI. Scenariusze manualne są zdefiniowane, ale nie zostały tutaj wykonane. `AC-06` i `AC-07` nie mają `PASS`. Niniejszy dokument jest lokalnym projektem do ponownego review; nie zapisano go w GitHub.
+Monorepo — L03; formalne szablony ADR — L04; CI i branch protection — L05. Nie wykonano testów aplikacji ani CI. Scenariusze manualne są zdefiniowane, ale nie zostały tutaj wykonane. `AC-06` i `AC-07` nie mają `PASS`. Niniejszy dokument został zatwierdzony w rozmowie L02; lokalna korekta redakcyjna nie została zapisana w GitHub.
--- tasks-v0.2.md
+++ tasks.md
@@ -2,8 +2,8 @@
 
 - **ID:** `002-ai-workflow`
 - **Wersja:** 0.2
-- **Status:** Draft — do ponownego review właściciela; niezatwierdzony
-- **Podstawa:** `requirements.md` v0.2, `spec.md` v0.2 i `design.md` v0.2 — zatwierdzone przez właściciela w rozmowie L02; metadane lokalnych kopii wymagają synchronizacji przed zapisem w GitHub.
+- **Status:** Approved — zatwierdzono przez właściciela w rozmowie L02 (2026-11-13); zapis do GitHub nieautoryzowany
+- **Podstawa:** `requirements.md`, `spec.md` i `design.md` v0.2 — zatwierdzone przez właściciela w rozmowie L02; lokalne metadane zsynchronizowane redakcyjnie, bez zapisu do GitHub.
 - **Zakres:** wyłącznie dokumentacja, symulacje manualne i dowody procesu; bez kodu aplikacji, zależności, konfiguracji CI i infrastruktury.
 - **Zasada:** ten dokument nie autoryzuje zapisu do GitHub. Zlecenie zmieniające repozytorium jest dopuszczalne dopiero po G0 `PASS`, zatwierdzeniu wszystkich czterech dokumentów (G1–G4) oraz odrębnej zgodzie na wykonanie w określonym zakresie.
 
@@ -17,6 +17,8 @@
 6. **Review:** każda uwaga zawiera poziom (`Critical`/`Major`/`Minor`/`Suggestion`), plik, problem, ryzyko, poprawkę i sposób weryfikacji. Otwarte `Critical`/`Major` blokują G6 i G7. W L02 nie wymagamy testów aplikacji ani CI; jeśli są wspominane, oznacz je `NOT RUN`, nie `PASS`.
 
 ## 2. Zadania i zależności
+
+**Uwaga historyczna:** poniższe statusy `TODO` dokumentują stan planu w chwili sporządzenia `tasks.md` v0.2, a nie bieżący stan realizacji. Po review właściciela lokalne raporty T-01–T-04 zostały zaakceptowane; T-05 ma wykonany pre-review, ale pozostaje `BLOCKED` w zakresie G0, zapisu i weryfikacji GitHub. Bieżące dowody znajdują się w lokalnym `evidence/` i wymagają osobnej autoryzacji przed publikacją.
 
 | Zadanie | Cel | Zależności do wykonania/zapisu | Powiązane AC | Status zadania |
 |---|---|---|---|---|
@@ -98,4 +100,4 @@
 - [ ] T-06: raport G7 przedstawiony właścicielowi, a właściciel jawnie wydał decyzję `Lesson 02: CLOSED`.
 - [ ] Dopiero po tej decyzji zaktualizowano `progress.md` i zweryfikowano jego commit.
 
-**Stan na moment przygotowania v0.2:** test diagnostyczny 20/20 przeprowadzono w rozmowie, ale zadania dokumentacyjne i scenariusze manualne nie mają jeszcze dowodów ukończenia. Nie wykonywano testów aplikacji ani CI. `tasks.md` v0.2 pozostaje projektem do review, a GitHub nie został zmieniony.
+**Stan przy sporządzeniu pierwotnego planu v0.2:** test diagnostyczny 20/20 był przeprowadzony, ale zadania dokumentacyjne i scenariusze manualne nie miały jeszcze dowodów. **Stan po lokalnym pre-review T-05 (2026-11-13):** właściciel zaakceptował raporty T-01–T-04; wykonano symulacje S-05 i S-08, lecz G0 i operacyjna weryfikacja G6 pozostają `BLOCKED`. Nie wykonywano testów aplikacji ani CI. Dokument v0.2 jest zatwierdzony w rozmowie, ale nie został zapisany w GitHub.

```
