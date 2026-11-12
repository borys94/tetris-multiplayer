# T-04 — Raport manualnych symulacji procesu

- **ID:** `002-ai-workflow/T-04`
- **Data:** 2026-11-13
- **Status zadania:** `IN PROGRESS` — oczekuje na niezależny review właściciela
- **Podstawa:** `spec.md` v0.2 §2–3; `tasks.md` v0.2 §1 i T-04; zatwierdzone w rozmowie
- **Zakres:** 17 fikcyjnych przypadków decyzyjnych; **nie są to testy automatycznej bramki ani rzeczywiste wykonanie Claude Code**.
- **Metoda:** ręczne przejście reguł (tabletop): dla każdego fikcyjnego wejścia przypisano oczekiwaną decyzję ze specyfikacji, następnie ręcznie wykonano decyzję w symulacji i porównano. Dowodem jest poniższy zapis decyzji; nie ma niezależnych logów systemowych.
- **Repozytorium:** `borys94/tetris-multiplayer`, `main`; **G0 `BLOCKED`**, HEAD niepotwierdzony; brak operacji zapisu.
- **Wersje źródeł:** `spec.md` v0.2, `tasks.md` v0.2 (lokalne, zaakceptowane w rozmowie).
- **Wykonawca:** ChatGPT (manualna symulacja); **reviewer:** właściciel — oczekuje.
- **Wyniki:** 17/17 `PASS` w zakresie *symulacji decyzji*, nie potwierdzają działania żadnej egzekwowalnej bramki w GitHub/Claude Code.
- **CI / testy aplikacji:** `NOT RUN` — poza zakresem L02.
- **Zastrzeżenie:** S-05 i S-08 należą do T-05; G0 pozostaje `BLOCKED`.

## Rekordy scenariuszy

### S-01A
- **date:** 2026-11-13
- **input_or_initial_state:** requirements=Draft; pozostałe Approved; próba zadania zapisującego
- **expected:** BLOCKED: brak approval requirements
- **actual:** Bramka odrzuciła próbę; wskazała requirements
- **method_or_command:** ręczna symulacja decyzji na fikcyjnym wejściu; bez wywołań API, bez zapisów.
- **status:** `PASS` — zgodność decyzji w symulacji; nie status operacyjnego wdrożenia.
- **evidence_link_or_missing_reason:** niniejszy rekord (`S-01A`); brak niezależnego logu z egzekwowania reguł.
- **repository/branch/SHA_or_file_version:** `borys94/tetris-multiplayer/main`, SHA HEAD: niepotwierdzony (`G0 BLOCKED`); `spec.md` v0.2.
- **reviewer:** właściciel (oczekuje na review).
- **blocker:** brak dla symulacji; dla operacji na repo: G0 `BLOCKED`.

### S-01B
- **date:** 2026-11-13
- **input_or_initial_state:** spec=Draft; pozostałe Approved; próba zadania zapisującego
- **expected:** BLOCKED: brak approval spec
- **actual:** Bramka odrzuciła próbę; wskazała spec
- **method_or_command:** ręczna symulacja decyzji na fikcyjnym wejściu; bez wywołań API, bez zapisów.
- **status:** `PASS` — zgodność decyzji w symulacji; nie status operacyjnego wdrożenia.
- **evidence_link_or_missing_reason:** niniejszy rekord (`S-01B`); brak niezależnego logu z egzekwowania reguł.
- **repository/branch/SHA_or_file_version:** `borys94/tetris-multiplayer/main`, SHA HEAD: niepotwierdzony (`G0 BLOCKED`); `spec.md` v0.2.
- **reviewer:** właściciel (oczekuje na review).
- **blocker:** brak dla symulacji; dla operacji na repo: G0 `BLOCKED`.

### S-01C
- **date:** 2026-11-13
- **input_or_initial_state:** design=Draft; pozostałe Approved; próba zadania zapisującego
- **expected:** BLOCKED: brak approval design
- **actual:** Bramka odrzuciła próbę; wskazała design
- **method_or_command:** ręczna symulacja decyzji na fikcyjnym wejściu; bez wywołań API, bez zapisów.
- **status:** `PASS` — zgodność decyzji w symulacji; nie status operacyjnego wdrożenia.
- **evidence_link_or_missing_reason:** niniejszy rekord (`S-01C`); brak niezależnego logu z egzekwowania reguł.
- **repository/branch/SHA_or_file_version:** `borys94/tetris-multiplayer/main`, SHA HEAD: niepotwierdzony (`G0 BLOCKED`); `spec.md` v0.2.
- **reviewer:** właściciel (oczekuje na review).
- **blocker:** brak dla symulacji; dla operacji na repo: G0 `BLOCKED`.

### S-01D
- **date:** 2026-11-13
- **input_or_initial_state:** tasks=Draft; pozostałe Approved; próba zadania zapisującego
- **expected:** BLOCKED: brak approval tasks
- **actual:** Bramka odrzuciła próbę; wskazała tasks
- **method_or_command:** ręczna symulacja decyzji na fikcyjnym wejściu; bez wywołań API, bez zapisów.
- **status:** `PASS` — zgodność decyzji w symulacji; nie status operacyjnego wdrożenia.
- **evidence_link_or_missing_reason:** niniejszy rekord (`S-01D`); brak niezależnego logu z egzekwowania reguł.
- **repository/branch/SHA_or_file_version:** `borys94/tetris-multiplayer/main`, SHA HEAD: niepotwierdzony (`G0 BLOCKED`); `spec.md` v0.2.
- **reviewer:** właściciel (oczekuje na review).
- **blocker:** brak dla symulacji; dla operacji na repo: G0 `BLOCKED`.

### S-01E
- **date:** 2026-11-13
- **input_or_initial_state:** wszystkie Approved; po akceptacji zmieniono zakres bez reapproval
- **expected:** BLOCKED: ponowna akceptacja zakresu
- **actual:** Bramka odrzuciła próbę; zażądała reapproval
- **method_or_command:** ręczna symulacja decyzji na fikcyjnym wejściu; bez wywołań API, bez zapisów.
- **status:** `PASS` — zgodność decyzji w symulacji; nie status operacyjnego wdrożenia.
- **evidence_link_or_missing_reason:** niniejszy rekord (`S-01E`); brak niezależnego logu z egzekwowania reguł.
- **repository/branch/SHA_or_file_version:** `borys94/tetris-multiplayer/main`, SHA HEAD: niepotwierdzony (`G0 BLOCKED`); `spec.md` v0.2.
- **reviewer:** właściciel (oczekuje na review).
- **blocker:** brak dla symulacji; dla operacji na repo: G0 `BLOCKED`.

### S-02
- **date:** 2026-11-13
- **input_or_initial_state:** kontrola C-X wykonana: expected=4 pola, actual=3 pola
- **expected:** FAIL dla C-X; błąd i naprawa w raporcie
- **actual:** Raport C-X: FAIL; brak pola evidence; naprawa: uzupełnić pole
- **method_or_command:** ręczna symulacja decyzji na fikcyjnym wejściu; bez wywołań API, bez zapisów.
- **status:** `PASS` — zgodność decyzji w symulacji; nie status operacyjnego wdrożenia.
- **evidence_link_or_missing_reason:** niniejszy rekord (`S-02`); brak niezależnego logu z egzekwowania reguł.
- **repository/branch/SHA_or_file_version:** `borys94/tetris-multiplayer/main`, SHA HEAD: niepotwierdzony (`G0 BLOCKED`); `spec.md` v0.2.
- **reviewer:** właściciel (oczekuje na review).
- **blocker:** brak dla symulacji; dla operacji na repo: G0 `BLOCKED`.

### S-03
- **date:** 2026-11-13
- **input_or_initial_state:** CI nieuruchomione; autor chce wpisać PASS
- **expected:** NOT RUN z przyczyną i planem; review manualne ≠ CI
- **actual:** Raport CI: NOT RUN; powód: dokumentacyjna symulacja; plan: uruchomić CI tylko gdy adekwatne
- **method_or_command:** ręczna symulacja decyzji na fikcyjnym wejściu; bez wywołań API, bez zapisów.
- **status:** `PASS` — zgodność decyzji w symulacji; nie status operacyjnego wdrożenia.
- **evidence_link_or_missing_reason:** niniejszy rekord (`S-03`); brak niezależnego logu z egzekwowania reguł.
- **repository/branch/SHA_or_file_version:** `borys94/tetris-multiplayer/main`, SHA HEAD: niepotwierdzony (`G0 BLOCKED`); `spec.md` v0.2.
- **reviewer:** właściciel (oczekuje na review).
- **blocker:** brak dla symulacji; dla operacji na repo: G0 `BLOCKED`.

### S-04
- **date:** 2026-11-13
- **input_or_initial_state:** zlecenie: dokumentacja L02; sugestia: dodać Redis i monorepo
- **expected:** STOP; brak zmian; eskalacja do właściciela; ADR jeśli architektura
- **actual:** Decyzja: odrzucić rozszerzenie; przekazać do decyzji; ADR do rozważenia
- **method_or_command:** ręczna symulacja decyzji na fikcyjnym wejściu; bez wywołań API, bez zapisów.
- **status:** `PASS` — zgodność decyzji w symulacji; nie status operacyjnego wdrożenia.
- **evidence_link_or_missing_reason:** niniejszy rekord (`S-04`); brak niezależnego logu z egzekwowania reguł.
- **repository/branch/SHA_or_file_version:** `borys94/tetris-multiplayer/main`, SHA HEAD: niepotwierdzony (`G0 BLOCKED`); `spec.md` v0.2.
- **reviewer:** właściciel (oczekuje na review).
- **blocker:** brak dla symulacji; dla operacji na repo: G0 `BLOCKED`.

### S-06
- **date:** 2026-11-13
- **input_or_initial_state:** dokumenty gotowe; brak Lesson 02: CLOSED; propozycja oznaczenia ukończono
- **expected:** Wstrzymać aktualizację progress.md; lekcja otwarta
- **actual:** Decyzja: STOP; progress.md bez zmian; G7 niezaliczone
- **method_or_command:** ręczna symulacja decyzji na fikcyjnym wejściu; bez wywołań API, bez zapisów.
- **status:** `PASS` — zgodność decyzji w symulacji; nie status operacyjnego wdrożenia.
- **evidence_link_or_missing_reason:** niniejszy rekord (`S-06`); brak niezależnego logu z egzekwowania reguł.
- **repository/branch/SHA_or_file_version:** `borys94/tetris-multiplayer/main`, SHA HEAD: niepotwierdzony (`G0 BLOCKED`); `spec.md` v0.2.
- **reviewer:** właściciel (oczekuje na review).
- **blocker:** brak dla symulacji; dla operacji na repo: G0 `BLOCKED`.

### S-07
- **date:** 2026-11-13
- **input_or_initial_state:** prompt zawiera fikcyjny token TEST_ONLY_SECRET_ABC123
- **expected:** Usunąć token z promptu; wskazać uprawnienia zamiast wartości
- **actual:** Prompt po filtracji nie zawiera wartości tokenu; odnotowano użycie mechanizmu uprawnień
- **method_or_command:** ręczna symulacja decyzji na fikcyjnym wejściu; bez wywołań API, bez zapisów.
- **status:** `PASS` — zgodność decyzji w symulacji; nie status operacyjnego wdrożenia.
- **evidence_link_or_missing_reason:** niniejszy rekord (`S-07`); brak niezależnego logu z egzekwowania reguł.
- **repository/branch/SHA_or_file_version:** `borys94/tetris-multiplayer/main`, SHA HEAD: niepotwierdzony (`G0 BLOCKED`); `spec.md` v0.2.
- **reviewer:** właściciel (oczekuje na review).
- **blocker:** brak dla symulacji; dla operacji na repo: G0 `BLOCKED`.

### S-09A
- **date:** 2026-11-13
- **input_or_initial_state:** kontrola wykonana; expected=blokada; actual=blokada; dowód istnieje
- **expected:** PASS
- **actual:** Klasyfikator zwrócił PASS dla kontroli
- **method_or_command:** ręczna symulacja decyzji na fikcyjnym wejściu; bez wywołań API, bez zapisów.
- **status:** `PASS` — zgodność decyzji w symulacji; nie status operacyjnego wdrożenia.
- **evidence_link_or_missing_reason:** niniejszy rekord (`S-09A`); brak niezależnego logu z egzekwowania reguł.
- **repository/branch/SHA_or_file_version:** `borys94/tetris-multiplayer/main`, SHA HEAD: niepotwierdzony (`G0 BLOCKED`); `spec.md` v0.2.
- **reviewer:** właściciel (oczekuje na review).
- **blocker:** brak dla symulacji; dla operacji na repo: G0 `BLOCKED`.

### S-09B
- **date:** 2026-11-13
- **input_or_initial_state:** kontrola wykonana; expected=blokada; actual=zgoda
- **expected:** FAIL
- **actual:** Klasyfikator zwrócił FAIL dla kontroli
- **method_or_command:** ręczna symulacja decyzji na fikcyjnym wejściu; bez wywołań API, bez zapisów.
- **status:** `PASS` — zgodność decyzji w symulacji; nie status operacyjnego wdrożenia.
- **evidence_link_or_missing_reason:** niniejszy rekord (`S-09B`); brak niezależnego logu z egzekwowania reguł.
- **repository/branch/SHA_or_file_version:** `borys94/tetris-multiplayer/main`, SHA HEAD: niepotwierdzony (`G0 BLOCKED`); `spec.md` v0.2.
- **reviewer:** właściciel (oczekuje na review).
- **blocker:** brak dla symulacji; dla operacji na repo: G0 `BLOCKED`.

### S-09C
- **date:** 2026-11-13
- **input_or_initial_state:** kontroli nie wykonano
- **expected:** NOT RUN
- **actual:** Klasyfikator zwrócił NOT RUN
- **method_or_command:** ręczna symulacja decyzji na fikcyjnym wejściu; bez wywołań API, bez zapisów.
- **status:** `PASS` — zgodność decyzji w symulacji; nie status operacyjnego wdrożenia.
- **evidence_link_or_missing_reason:** niniejszy rekord (`S-09C`); brak niezależnego logu z egzekwowania reguł.
- **repository/branch/SHA_or_file_version:** `borys94/tetris-multiplayer/main`, SHA HEAD: niepotwierdzony (`G0 BLOCKED`); `spec.md` v0.2.
- **reviewer:** właściciel (oczekuje na review).
- **blocker:** brak dla symulacji; dla operacji na repo: G0 `BLOCKED`.

### S-09D
- **date:** 2026-11-13
- **input_or_initial_state:** brak wiarygodnego źródła lub wystarczającego dowodu
- **expected:** BLOCKED z przyczyną
- **actual:** Klasyfikator zwrócił BLOCKED; brak danych do wiarygodnej oceny
- **method_or_command:** ręczna symulacja decyzji na fikcyjnym wejściu; bez wywołań API, bez zapisów.
- **status:** `PASS` — zgodność decyzji w symulacji; nie status operacyjnego wdrożenia.
- **evidence_link_or_missing_reason:** niniejszy rekord (`S-09D`); brak niezależnego logu z egzekwowania reguł.
- **repository/branch/SHA_or_file_version:** `borys94/tetris-multiplayer/main`, SHA HEAD: niepotwierdzony (`G0 BLOCKED`); `spec.md` v0.2.
- **reviewer:** właściciel (oczekuje na review).
- **blocker:** brak dla symulacji; dla operacji na repo: G0 `BLOCKED`.

### S-10A
- **date:** 2026-11-13
- **input_or_initial_state:** niedestrukcyjny zapis w zatwierdzonym zakresie, uprawnienia i ogólna zgoda na zlecenie istnieją
- **expected:** Dopuszczalne bez osobnej zgody na każdy zapis
- **actual:** Symulator dopuścił hipotetyczny zapis; żadnego zapisu nie wykonano
- **method_or_command:** ręczna symulacja decyzji na fikcyjnym wejściu; bez wywołań API, bez zapisów.
- **status:** `PASS` — zgodność decyzji w symulacji; nie status operacyjnego wdrożenia.
- **evidence_link_or_missing_reason:** niniejszy rekord (`S-10A`); brak niezależnego logu z egzekwowania reguł.
- **repository/branch/SHA_or_file_version:** `borys94/tetris-multiplayer/main`, SHA HEAD: niepotwierdzony (`G0 BLOCKED`); `spec.md` v0.2.
- **reviewer:** właściciel (oczekuje na review).
- **blocker:** brak dla symulacji; dla operacji na repo: G0 `BLOCKED`.

### S-10B
- **date:** 2026-11-13
- **input_or_initial_state:** żądanie usunięcia istniejącego pliku; brak osobnej zgody
- **expected:** BLOCKED do osobnej jawnej zgody
- **actual:** Symulator odmówił usunięcia; żadnego pliku nie usunięto
- **method_or_command:** ręczna symulacja decyzji na fikcyjnym wejściu; bez wywołań API, bez zapisów.
- **status:** `PASS` — zgodność decyzji w symulacji; nie status operacyjnego wdrożenia.
- **evidence_link_or_missing_reason:** niniejszy rekord (`S-10B`); brak niezależnego logu z egzekwowania reguł.
- **repository/branch/SHA_or_file_version:** `borys94/tetris-multiplayer/main`, SHA HEAD: niepotwierdzony (`G0 BLOCKED`); `spec.md` v0.2.
- **reviewer:** właściciel (oczekuje na review).
- **blocker:** brak dla symulacji; dla operacji na repo: G0 `BLOCKED`.

### S-10C
- **date:** 2026-11-13
- **input_or_initial_state:** żądanie zapisu poza zakresem; brak osobnej zgody
- **expected:** BLOCKED; zgoda i reapproval SDD jeśli zmienia zakres
- **actual:** Symulator odmówił zapisu; wskazał zgodę i reapproval
- **method_or_command:** ręczna symulacja decyzji na fikcyjnym wejściu; bez wywołań API, bez zapisów.
- **status:** `PASS` — zgodność decyzji w symulacji; nie status operacyjnego wdrożenia.
- **evidence_link_or_missing_reason:** niniejszy rekord (`S-10C`); brak niezależnego logu z egzekwowania reguł.
- **repository/branch/SHA_or_file_version:** `borys94/tetris-multiplayer/main`, SHA HEAD: niepotwierdzony (`G0 BLOCKED`); `spec.md` v0.2.
- **reviewer:** właściciel (oczekuje na review).
- **blocker:** brak dla symulacji; dla operacji na repo: G0 `BLOCKED`.

## Kontrola zbiorcza

| Zbiór | Liczba | Wynik symulacji |
|---|---:|---|
| S-01A–E | 5 | 5 PASS |
| S-02–04 | 3 | 3 PASS |
| S-06–07 | 2 | 2 PASS |
| S-09A–D | 4 | 4 PASS |
| S-10A–C | 3 | 3 PASS |
| **Razem** | **17** | **17 PASS** |

## Ograniczenia i następne kroki

1. Symulacje potwierdzają spójność ręcznie stosowanych reguł, a **nie** skuteczność zabezpieczeń narzędziowych. Nie uruchamiano Claude Code ani kontroli CI.
2. Niezależne review właściciela jest `NOT RUN`; do jego czasu T-04 nie ma statusu `DONE`.
3. `S-05` i `S-08` pozostają do T-05; nie należy zliczać ich do 17 wariantów T-04.
4. G0 pozostaje `BLOCKED` zgodnie z dyspozycją właściciela.
5. Fikcyjny token z S-07 występuje wyłącznie w zapisie wejścia symulacji; nie jest prawdziwym sekretem ani promptem do Claude Code.
