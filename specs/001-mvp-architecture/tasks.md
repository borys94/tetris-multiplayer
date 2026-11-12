# Tasks — Lekcja 01: dokumentacja SDD

- **ID:** 001-mvp-architecture
- **Wersja:** 0.4
- **Status:** Approved — zatwierdzono merytorycznie przez właściciela
- **Podstawa:** `requirements.md` v0.2, `spec.md` v0.3, `design.md` v0.2 (zatwierdzone merytorycznie przez właściciela)
- **Zakres:** wyłącznie dokumentacja i jej weryfikacja; bez kodu aplikacji, konfiguracji CI i infrastruktury

## 1. Zasady, statusy i standard dowodu

Przed pracą odczytać `syllabus.md`, `progress.md` i cztery dokumenty SDD. Nie zakładać dostępu do repozytorium, historii Git ani wyników testów bez ich sprawdzenia. Nie rozszerzać zakresu o implementację monorepo, silnika, WebSocket, CI lub AWS. Nie rozstrzygać otwartych kwestii produktowych bez akceptacji.

**Status zadania:** `PASS` — wszystkie kryteria zadania zweryfikowane dowodami; `FAIL` — stwierdzona niezgodność; `BLOCKED` — brak dostępu, zatwierdzenia lub dowodu uniemożliwia rozstrzygnięcie. `NOT RUN` oznacza brak przeprowadzonej weryfikacji i nie jest równoznaczne z `PASS`. Początkowy status każdego zadania: **NOT RUN**; historyczne review w rozmowie nie zastępuje dowodu w repozytorium.

**Evidence record dla każdego T-01–T-06:** ID zadania, data, sprawdzone ścieżki i wersje, zastosowana kontrola, status `NOT RUN/PASS/FAIL/BLOCKED` (przed wykonaniem: `NOT RUN`, po wykonaniu: wynik kontroli), lokalizacja raportu lub referencja do commita/PR (jeżeli istnieje), uwagi otwarte z klasyfikacją oraz osoba dokonująca review. Dla `NOT RUN` zapisać „kontrola niewykonana” i planowaną metodę weryfikacji; nie wymagać nieistniejącego raportu ani wyniku testu. Dla `BLOCKED` wskazać konkretną przeszkodę. Nie wpisywać fikcyjnych commitów ani wyników uruchomienia testów. Raport można przygotować jako artefakt review; zapis w repozytorium wymaga późniejszego potwierdzenia.

**Kolejność i zależności:** T-01 (rozpoznanie źródeł) → T-02 → T-03 → T-04 → T-05 → T-06. Jeżeli T-01 jest `BLOCKED` wyłącznie z powodu braku Git, dopuszcza się lokalne review dokumentów, ale T-06 pozostaje `BLOCKED` do uzyskania dowodu repozytoryjnego.

## 2. Zadania dla Claude Code

### T-01 — Weryfikacja punktu wyjścia
- **Cel:** potwierdzić strukturę repozytorium, dostępność `syllabus.md`, `progress.md`, dokumentów SDD i stan Git.
- **Warunek startu:** dostęp do plików lub jawne zgłoszenie braku dostępu.
- **Wynik:** raport źródeł i punktu odniesienia; bez modyfikacji aplikacji.
- **Powiązanie:** AC-06.
- **Kontrola PASS:** odczytane ścieżki i wersje, branch i commit (jeżeli Git dostępny), wskazane braki; gdy repozytorium niedostępne — `BLOCKED` dla dowodu Git.
- **Evidence:** lista ścieżek, wynik odczytu, `git status`, `git rev-parse HEAD` (tylko gdy dostępne), referencja do raportu. W T-06 osobno potwierdzić zawartość każdego z czterech dokumentów w wskazanym commicie; sam hash nie dowodzi zgodności treści.
- **Status wykonania:** NOT RUN.

### T-02 — Review wymagań i granic MVP
- **Cel:** porównać M2/M3/M4 i zatwierdzone D-01–D-05; zachować FR-01–FR-10 oraz NFR-01–NFR-07.
- **Warunek startu:** T-01 umożliwia odczyt źródeł.
- **Wynik:** `requirements.md` v0.2, rejestr decyzji, zakres, wykluczenia i otwarte kontrakty.
- **Powiązanie:** AC-01, AC-02.
- **Kontrola PASS:** brak funkcji M4 w M3; wszystkie identyfikatory stabilne i unikalne; D-01–D-05 zgodne z akceptacją; brak pozornego domykania otwartych decyzji.
- **Evidence:** porównanie wersji i zakresu, lista ID, raport zgodności decyzji, potwierdzenie akceptacji właściciela.
- **Status wykonania:** NOT RUN.

### T-03 — Review scenariuszy i macierzy śledzenia
- **Cel:** zweryfikować Given/When/Then, przypadki brzegowe, FR/NFR, D-01–D-05 i S-01–S-20.
- **Warunek startu:** T-02 zakończone merytorycznie.
- **Wynik:** `spec.md` v0.3 z macierzą, jawnymi odroczeniami i rozróżnieniem kryteriów L01 od przyszłych testów produktu.
- **Powiązanie:** AC-02, AC-06.
- **Kontrola PASS:** AC-01–AC-06 i S-01–S-20 zachowane; każde FR/NFR ma scenariusz lub jawne odroczenie; FR-10/S-17 oznaczone `Deferred specification`; brak twierdzeń o nieuruchomionych testach.
- **Evidence:** wykaz scenariuszy i ID, macierz FR/NFR→S, rejestr odroczeń, wynik review i akceptacja właściciela.
- **Status wykonania:** NOT RUN.

### T-04 — Review projektu technicznego
- **Cel:** sprawdzić granice modułów, źródło prawdy, przepływy i bezpieczeństwo względem S-01–S-20.
- **Warunek startu:** T-03 zakończone merytorycznie.
- **Wynik:** `design.md` v0.2 z alternatywami, ryzykami i kandydatami ADR-001–ADR-005 (bez tworzenia formalnych ADR w L01).
- **Powiązanie:** AC-03, AC-04.
- **Kontrola PASS:** silnik niezależny od UI/transportu (S-19); serwer autorytatywny; oddzielne zaproszenie, tożsamość gościa i prawo do miejsca (S-02, S-10, S-14, S-18); knockout i niezmienność wyniku (S-11–S-13); reconnect bez pauzy, 30 s czasu serwera, bez wejść zastępczych (S-07); walidacja schematu/uprawnień/aktualności/duplikatów; klawiatura poza silnikiem (S-15); kontrola sekretów (S-20); ADR-001–ADR-005 zachowane.
- **Evidence:** przegląd granic i przepływów, mapowanie D/S→komponent, lista ryzyk i odroczeń, potwierdzenie akceptacji.
- **Status wykonania:** NOT RUN.

### T-05 — Kontrola spójności pakietu SDD
- **Cel:** sprawdzić cztery dokumenty, statusy, identyfikatory, odwołania i decyzje.
- **Warunek startu:** T-02–T-04 poddane review.
- **Wynik:** raport spójności z klasyfikacją `Critical`/`Major`/`Minor`/`Suggestion`, lokalizacją, ryzykiem, poprawką i sposobem weryfikacji.
- **Powiązanie:** AC-05, AC-06.
- **Kontrola PASS:** macierz T→AC kompletna; FR-01–FR-10, NFR-01–NFR-07, D-01–D-05, S-01–S-20 i ADR-001–ADR-005 sprawdzone; statusy zatwierdzeń nie są sprzeczne; otwarte odroczenia jawne; brak nierozwiązanych Critical/Major.
- **Evidence:** raport kontroli identyfikatorów, tabela traceability, lista niezgodności z rozstrzygnięciami i wersjami źródeł.
- **Status wykonania:** NOT RUN.

### T-06 — Raport gotowości do zamknięcia lekcji 01
- **Cel:** zebrać dowody T-01–T-05, cztery akceptacje dokumentów przez właściciela, raport spójności oraz dowód zapisania właściwych wersji dokumentów w repozytorium; przedstawić właścicielowi raport gotowości do decyzji o zamknięciu.
- **Warunek startu:** T-05 ma wynik PASS; komplet dowodów T-01–T-05.
- **Wynik:** raport `Lesson 01 Completion Gate` z oceną gotowości do zamknięcia lekcji, bez przygotowywania ani zapisywania aktualizacji `progress.md`. Propozycja aktualizacji powstaje dopiero po decyzji `Lesson 01: CLOSED`, zgodnie z §6.
- **Powiązanie:** AC-01–AC-06.
- **Kontrola PASS:** cztery dokumenty zatwierdzone, brak otwartych Critical/Major, udokumentowane kontrole i odroczenia, sprawdzony commit/PR zawierający właściwe wersje i treści dokumentów oraz gotowy raport rekomendujący zamknięcie lub wskazujący ryzyka. **Decyzja właściciela o zamknięciu nie jest warunkiem `T-06: PASS`** — następuje później. Gdy brak dowodu Git lub innego wymaganego dowodu — `BLOCKED`, nie `PASS`.
- **Evidence:** referencje do raportów T-01–T-05, identyfikator commita/PR, wykaz zaakceptowanych wersji, kontrola treści każdego pliku w commicie (np. `git show <commit>:<path>` i porównanie z wersją zatwierdzoną), wynik bramki `PASS/FAIL/BLOCKED` oraz raport gotowości dla właściciela. Nie wymagać na tym etapie decyzji `Lesson 01: CLOSED`.
- **Status wykonania:** NOT RUN.

## 3. Macierz zadanie → kryterium
| Zadanie | AC-01 | AC-02 | AC-03 | AC-04 | AC-05 | AC-06 |
|---|---|---|---|---|---|---|
| T-01 | | | | | | X |
| T-02 | X | X | | | | |
| T-03 | | X | | | | X |
| T-04 | | | X | X | | |
| T-05 | | | | | X | X |
| T-06 | X | X | X | X | X | X |

## 4. Kontrola traceability i decyzji

| Zakres kontroli | Zadanie | Oczekiwany dowód |
|---|---|---|
| M2/M3/M4, FR-01–FR-10, NFR-01–NFR-07 | T-02, T-03, T-05 | Raport zakresu i kompletności ID |
| D-01–D-05 | T-02, T-03, T-04, T-05 | Zgodność decyzji we wszystkich dokumentach |
| S-01–S-20, w tym S-07, S-11–S-14, S-18–S-20 | T-03, T-04, T-05 | Macierz scenariusz → odpowiedzialność projektu |
| ADR-001–ADR-005 | T-04, T-05 | Zachowanie kandydatów i alternatyw; formalizacja w L04 |
| FR-10/S-17 i inne otwarte kontrakty | T-03, T-04, T-05 | Jawny rejestr odroczeń, bez fałszywego PASS implementacji |
| AC-01–AC-06 | T-01–T-06 | Macierz z §3 i raport bramki |

## 5. Lesson 01 Readiness Gate (T-06)

- [ ] `requirements.md` v0.2 zatwierdzony przez właściciela.
- [ ] `spec.md` v0.3 zatwierdzony przez właściciela.
- [ ] `design.md` v0.2 zatwierdzony przez właściciela.
- [ ] `tasks.md` v0.4 zatwierdzony przez właściciela.
- [ ] Każde T-01–T-05 ma `PASS` z referencją do dowodu; T-06 ma komplet danych.
- [ ] Końcowy raport spójności: brak otwartych `Critical` i `Major`; uwagi `Minor`/`Suggestion` oraz odroczenia jawne.
- [ ] Wszystkie cztery dokumenty zapisane w repozytorium; dla każdego sprawdzono wersję **i treść** w konkretnym commicie (lub w commicie PR), a nie tylko istnienie hasha.
- [ ] Nie deklarowano testów aplikacji, których nie wykonano.
- [ ] Przygotowano raport gotowości T-06 z wynikiem `PASS/FAIL/BLOCKED` i przekazano go właścicielowi do decyzji.

**Reguła:** brak wymaganego dowodu oznacza `T-06: BLOCKED`; wykryta niezgodność oznacza `FAIL`. Komplet dowodów i spełnienie warunków oznacza `T-06: PASS`, ale **nie zamyka automatycznie lekcji**.

## 6. Decyzja właściciela i działania po zamknięciu

1. Po `T-06: PASS` właściciel otrzymuje raport gotowości i podejmuje odrębną, jawną decyzję: `Lesson 01: CLOSED` albo pozostawienie lekcji otwartej.
2. Jeśli decyzja jest odmowna, lekcja pozostaje otwarta mimo `T-06: PASS`; uwagi właściciela są dokumentowane i ponownie oceniane.
3. **Dopiero po `Lesson 01: CLOSED`** przygotować propozycję aktualizacji `progress.md`, uzyskać zgodę na jej zapis i zweryfikować aktualizację. Sam raport T-06 nie upoważnia do zmiany `progress.md`.
4. Jeśli właściciel zamknie lekcję, lecz zapis `progress.md` nie został jeszcze wykonany, odnotować zaległe działanie dokumentacyjne; nie deklarować, że postęp został już zaktualizowany.

## 7. Poza zakresem

Nie tworzyć aplikacji React, serwera Fastify, silnika gry, migracji, pipeline CI, infrastruktury AWS ani formalnych plików ADR. Monorepo i CI należą do późniejszych lekcji; formalizacja ADR do lekcji 04.
