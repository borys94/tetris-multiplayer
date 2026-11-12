# Specification — weryfikowalny proces współpracy z AI

- **ID:** `002-ai-workflow`
- **Wersja:** 0.2
- **Status:** Approved — zatwierdzono przez właściciela w rozmowie L02 (2026-11-13); zapis do GitHub nieautoryzowany
- **Podstawa:** `requirements.md`, `design.md` i `tasks.md` v0.2 — zatwierdzone przez właściciela w rozmowie L02; lokalne metadane synchronizowane redakcyjnie, bez zapisu do GitHub.
- **Charakter weryfikacji:** scenariusze manualne i review dokumentów; bez testów aplikacji ani CI.

## 1. Kryteria akceptacji

| ID | Given | When | Then | Dowód |
|---|---|---|---|---|
| AC-01 | Dostępny wynik testu diagnostycznego L02 | Sporządzono raport diagnozy | Raport zawiera datę, zakres, liczbę pytań, liczbę poprawnych odpowiedzi, wynik punktowy, interpretację i ograniczenia; nie przypisuje poziomu seniority | Zapis rozmowy i raport w `evidence/` |
| AC-02 | Dostępny opis ról i uprawnień | Recenzent analizuje podział odpowiedzialności | Właściciel zatwierdza zakres, wszystkie cztery artefakty SDD, decyzje architektoniczne i zamknięcie; ChatGPT i Claude Code nie akceptują własnej pracy | Review macierzy odpowiedzialności i bramek |
| AC-03 | Zaplanowano zadanie zmieniające repozytorium | Brakuje zatwierdzenia co najmniej jednego z: `requirements.md`, `spec.md`, `design.md`, `tasks.md` | Zadanie nie rozpoczyna się; wynik bramki to `BLOCKED` ze wskazaniem brakujących akceptacji. Zmiana zatwierdzonego zakresu wymaga ponownej akceptacji właściwych artefaktów | S-01A–S-01E |
| AC-04 | Dostępny przykład zlecenia dla Claude Code | Recenzent porównuje go z wymaganiami | Zlecenie określa zakres, wykluczenia, powiązane AC, rezultat, warunki ukończenia i wymagane dowody | Review przykładu i checklista |
| AC-05 | Dostępne są przypadki kontroli i proponowanej zmiany zakresu | Proces ocenia raport i gotowość do akceptacji | `PASS`, `FAIL`, `NOT RUN`, `BLOCKED` mają znaczenie zgodne z FR-08; brak dowodów wyklucza `PASS`; zmiana zakresu wymaga decyzji właściciela | S-02–S-04, S-09A–S-09D |
| AC-06 | Istnieją cztery dokumenty SDD i raport review | Właściciel weryfikuje spójność, zatwierdzenia, śledzenie AC ↔ zadania oraz GitHub | Dokumenty są zatwierdzone, zgodne z wymaganiami, zapisane i zweryfikowane na wskazanej rewizji Git; review nie ma otwartych `Critical`/`Major`; brak dostępu do rewizji daje `BLOCKED`, a nie potwierdzenie zapisu | Raport review, S-05, S-08, commit/PR z SHA |
| AC-07 | AC-01–AC-06 mają potwierdzone `PASS`, zadania są ukończone i dowody zweryfikowane | Właściciel rozstrzyga zamknięcie | Dopiero jawna decyzja `Lesson 02: CLOSED` uprawnia do aktualizacji `progress.md`; aktualizacja ma zweryfikowany commit. Bez decyzji lekcja pozostaje otwarta | S-06, raport bramki, decyzja właściciela, commit `progress.md` |

## 2. Scenariusze kontrolne

### S-01A–S-01E: Bramka zatwierdzenia (FR-04, AC-03)

Dla każdego wariantu **Given** istnieje zadanie zmieniające repozytorium i wskazany artefakt nie jest zatwierdzony, **when** Claude Code ma rozpocząć zadanie, **then** bramka zwraca `BLOCKED`, wskazuje brakującą akceptację i nie rozpoczyna pracy.

| Wariant | `requirements.md` | `spec.md` | `design.md` | `tasks.md` | Oczekiwanie |
|---|---|---|---|---|---|
| S-01A | Draft | Approved | Approved | Approved | `BLOCKED`: requirements |
| S-01B | Approved | Draft | Approved | Approved | `BLOCKED`: spec |
| S-01C | Approved | Approved | Draft | Approved | `BLOCKED`: design |
| S-01D | Approved | Approved | Approved | Draft | `BLOCKED`: tasks |
| S-01E | Approved | Approved | Approved | Approved, lecz zakres zmieniono bez ponownej akceptacji | `BLOCKED`: ponowna akceptacja zakresu |

### S-02: Kontrola zakończona niepowodzeniem (FR-08, AC-05)

**Given** wykonana kontrola wykazała niespełnienie kryterium, **when** sporządzany jest raport, **then** zapisuje się `FAIL`, identyfikator kontroli, sposób wykonania, rzeczywisty wynik, istotny błąd i propozycję naprawy; nie deklaruje się `PASS`.

### S-03: Kontrola niewykonana (FR-08, NFR-03, AC-05)

**Given** nie uruchomiono CI, **when** sporządzany jest raport, **then** CI ma status `NOT RUN` z przyczyną i planem weryfikacji; wynik manualnego review nie jest przedstawiany jako wynik CI.

### S-04: Nieautoryzowane rozszerzenie zakresu (FR-06, AC-05)

**Given** zadanie dokumentacyjne L02, **when** AI proponuje Redis, monorepo lub nową istotną zależność, **then** nie wykonuje tej zmiany i przekazuje propozycję właścicielowi do decyzji; przy zmianie architektury rozważa ADR.

### S-05: Rozbieżność lokalnej kopii i GitHub (FR-02, AC-06)

**Given** lokalny `progress.md` różni się od pliku z dostępnej, jednoznacznie zidentyfikowanej rewizji GitHub, **when** rozpoczyna się praca, **then** raport wskazuje repozytorium, gałąź, SHA, datę odczytu i rozbieżność; decyzje zależne od stanu opiera na zweryfikowanej rewizji GitHub.

### S-06: Próba zamknięcia bez decyzji (FR-09, AC-07)

**Given** dokumenty są gotowe, ale brak decyzji właściciela `Lesson 02: CLOSED`, **when** AI proponuje aktualizację `progress.md` jako „ukończono”, **then** aktualizacja zostaje wstrzymana, a lekcja pozostaje otwarta.

### S-07: Sekrety i uprawnienia (NFR-04)

**Given** zlecenie zawiera przykładowy sekret (wyłącznie dane testowe), **when** przygotowywany jest prompt, **then** sekret nie trafia do przekazywanej treści; dostęp jest zapewniany odpowiednim mechanizmem uprawnień, bez ujawnienia wartości.

### S-08: Niedostępna rewizja GitHub (FR-02, AC-06)

**Given** nie można odczytać lub jednoznacznie zidentyfikować właściwej rewizji GitHub, **when** raport ma potwierdzić aktualny stan dokumentów, **then** weryfikacja ma `BLOCKED`, wskazuje przyczynę, brakujące dane i potrzebne działanie; lokalnej kopii nie przedstawia się jako aktualnego GitHub.

### S-09A–S-09D: Semantyka statusów (FR-08, AC-05)

| Wariant | Warunek | Oczekiwany status |
|---|---|---|
| S-09A | Kontrola wykonana, kryterium spełnione, komplet wystarczających dowodów | `PASS` |
| S-09B | Kontrola wykonana, kryterium niespełnione | `FAIL` |
| S-09C | Kontrola nie została wykonana | `NOT RUN` |
| S-09D | Nie można wykonać lub wiarygodnie ocenić kontroli z powodu przeszkody, np. niedostępnego źródła; także wykonana kontrola bez dowodów wystarczających do wiarygodnej oceny | `BLOCKED` z opisem przeszkody |

### S-10A–S-10C: Zgoda na zapis (NFR-04)

| Wariant | Warunek | Oczekiwanie |
|---|---|---|
| S-10A | Zapis niedestrukcyjny w zatwierdzonym zakresie, z odpowiednimi uprawnieniami | Dopuszczalny bez nowej zgody na każdą operację |
| S-10B | Usunięcie istniejącego pliku, nawet w obrębie projektu | Wymagana osobna jawna zgoda właściciela |
| S-10C | Zapis poza zatwierdzonym zakresem | Wymagana osobna jawna zgoda i, jeśli zmienia zakres SDD, ponowna akceptacja odpowiednich artefaktów |

## 3. Minimalny format raportu scenariusza

Dla każdego wariantu kontrolnego raport zawiera: **ID scenariusza, datę, wejście/stan początkowy, oczekiwany rezultat, rezultat rzeczywisty, status (`PASS`/`FAIL`/`NOT RUN`/`BLOCKED`), metodę wykonania, odnośnik do dowodu albo przyczynę braku dowodu**. Scenariusz nie jest `PASS` tylko dlatego, że opisano jego oczekiwany wynik.

Szczegółowe raporty i materiały dowodowe przechowujemy w `specs/002-ai-workflow/evidence/` po zatwierdzeniu i wykonaniu odpowiednich zadań. `progress.md` zawiera podsumowanie oraz odnośniki.

## 4. Macierz śledzenia

| Kryterium | Wymagania | Zadania (`tasks.md` v0.2 — zatwierdzone) | Metoda |
|---|---|---|---|
| AC-01 | FR-01 | T-01 | Raport diagnostyczny i review |
| AC-02 | FR-03, FR-04 | T-02 | Review ról i bramek |
| AC-03 | FR-04 | T-02, T-04 | S-01A–S-01E |
| AC-04 | FR-05, NFR-01 | T-03 | Review przykładu zlecenia |
| AC-05 | FR-06, FR-08, NFR-03 | T-04 | S-02–S-04, S-09A–S-09D |
| AC-06 | FR-02, FR-07, FR-10, NFR-02 | T-05 | Review SDD, S-05, S-08, Git |
| AC-07 | FR-09 | T-06 | S-06, decyzja, dowód Git |

**Wymagania przekrojowe:** NFR-04 jest weryfikowane przez S-07 i S-10A–S-10C w ramach planowanego T-04; NFR-05 przez dokumentacyjny charakter L02 i przegląd T-05. Zatwierdzone `tasks.md` v0.2 przypisuje wszystkie wymagane scenariusze do T-04 i T-05.

## 5. Granice i bramki ukończenia

1. **Gotowość dokumentacji (AC-06):** cztery dokumenty zatwierdzone, spójne, po review i potwierdzone w GitHub na konkretnej rewizji. To nie zamyka lekcji.
2. **Zamknięcie lekcji (AC-07):** potwierdzone wykonanie T-01–T-05, `PASS` dla AC-01–AC-06, brak otwartych `Critical`/`Major`, jawna decyzja właściciela, a następnie commit aktualizacji `progress.md`.
3. **Status na moment sporządzenia v0.2:** scenariusze są zdefiniowane, ale nie zostały przeprowadzone ani udokumentowane raportami. `AC-06` i `AC-07` nie mają `PASS`. Nie wykonano testów aplikacji ani CI.
