# Tasks — Lekcja 02: diagnoza i proces pracy z AI

- **ID:** `002-ai-workflow`
- **Wersja:** 0.2
- **Status:** Approved — zatwierdzono przez właściciela w rozmowie L02 (2026-11-13); zapis do GitHub nieautoryzowany
- **Podstawa:** `requirements.md`, `spec.md` i `design.md` v0.2 — zatwierdzone przez właściciela w rozmowie L02; lokalne metadane zsynchronizowane redakcyjnie, bez zapisu do GitHub.
- **Zakres:** wyłącznie dokumentacja, symulacje manualne i dowody procesu; bez kodu aplikacji, zależności, konfiguracji CI i infrastruktury.
- **Zasada:** ten dokument nie autoryzuje zapisu do GitHub. Zlecenie zmieniające repozytorium jest dopuszczalne dopiero po G0 `PASS`, zatwierdzeniu wszystkich czterech dokumentów (G1–G4) oraz odrębnej zgodzie na wykonanie w określonym zakresie.

## 1. Reguły wykonania i raportowania

1. **Baseline G0:** przed zleceniem odczytaj i zapisz `repository`, `branch`, jednoznaczny `commit SHA`/rewizję, `read_at`, status i rozbieżności. Niedostępna lub nieidentyfikowalna rewizja = `BLOCKED`; nie przedstawiaj lokalnej kopii jako aktualnego stanu GitHub. Przed wykonaniem zadania ponownie sprawdź, czy baseline nie jest nieaktualny.
2. **Bramki G1–G4:** właściciel zatwierdza kolejno `requirements.md`, `spec.md`, `design.md` i `tasks.md`. Każdy brak zatwierdzenia lub niezatwierdzona zmiana zakresu = `BLOCKED` dla zadania zmieniającego repozytorium. Zatwierdzenie dokumentów nie jest równoznaczne ze zgodą na zapis.
3. **Uprawnienia:** niedestrukcyjny zapis w zatwierdzonym zleceniu i przy właściwych uprawnieniach jest dopuszczalny; usunięcie pliku lub inna operacja destrukcyjna wymaga osobnej jawnej zgody. Zapis poza zakresem wymaga zgody i, jeśli zmienia SDD, ponownej akceptacji odpowiednich dokumentów. Nie ujawniaj sekretów.
4. **Status zadania:** `TODO` (nie rozpoczęto), `IN PROGRESS` (częściowo wykonane), `BLOCKED` (przeszkoda), `DONE` (rezultat, kontrole i dowody kompletne, po review). **Status kontroli:** `NOT RUN` (nie wykonano), `PASS` (wykonano, spełniono i udowodniono), `FAIL` (wykonano, niespełniono), `BLOCKED` (nie można wykonać lub wiarygodnie ocenić, np. brak wystarczających dowodów). Statusy zadań i kontroli są niezależne.
5. **Minimalny raport każdej kontroli:** `scenario_id`, `date`, `input_or_initial_state`, `expected`, `actual`, `method_or_command`, `status`, `evidence_link_or_missing_reason`, `repository/branch/SHA_or_file_version`, `reviewer`, `blocker` (jeśli dotyczy). Nie deklaruj `PASS` bez wykonania i dowodów. Dowody docelowo w `specs/002-ai-workflow/evidence/`; `progress.md` zawiera tylko statusy i odnośniki.
6. **Review:** każda uwaga zawiera poziom (`Critical`/`Major`/`Minor`/`Suggestion`), plik, problem, ryzyko, poprawkę i sposób weryfikacji. Otwarte `Critical`/`Major` blokują G6 i G7. W L02 nie wymagamy testów aplikacji ani CI; jeśli są wspominane, oznacz je `NOT RUN`, nie `PASS`.

## 2. Zadania i zależności

**Uwaga historyczna:** poniższe statusy `TODO` dokumentują stan planu w chwili sporządzenia `tasks.md` v0.2, a nie bieżący stan realizacji. Po review właściciela lokalne raporty T-01–T-04 zostały zaakceptowane; T-05 ma wykonany pre-review, ale pozostaje `BLOCKED` w zakresie G0, zapisu i weryfikacji GitHub. Bieżące dowody znajdują się w lokalnym `evidence/` i wymagają osobnej autoryzacji przed publikacją.

| Zadanie | Cel | Zależności do wykonania/zapisu | Powiązane AC | Status zadania |
|---|---|---|---|---|
| T-01 | Raport diagnozy | G0–G4 i zgoda przed zapisem do repo | AC-01 | TODO |
| T-02 | Role i bramki | G0–G4 i zgoda przed zapisem do repo | AC-02, AC-03 | TODO |
| T-03 | Kontrakt zlecenia Claude Code | G0–G4 i zgoda przed zapisem do repo; opis ról z T-02 | AC-04 | TODO |
| T-04 | Manualne scenariusze kontrolne | Zatwierdzony proces i przygotowane przykłady T-02/T-03; G0–G4 i zgoda przed zapisem dowodów | AC-03, AC-05 | TODO |
| T-05 | Review, synchronizacja i weryfikacja dokumentacji w GitHub (G6) | G0–G4; wyniki i dowody T-01–T-04; zgoda na zapis | AC-06 | TODO |
| T-06 | Bramka zamknięcia G7 i aktualizacja postępów | T-01–T-05 `DONE`, AC-01–AC-06 `PASS`, jawna decyzja właściciela; osobna zgoda na zapis `progress.md` | AC-07 | TODO |

Zależności nie oznaczają, że nie wolno przygotowywać lokalnych szkiców przed G4. Zabronione jest **wykonanie zadania zmieniającego repozytorium** przed przejściem bramek i uzyskaniem odpowiedniej zgody.

### T-01 — Zapis diagnozy (AC-01)

- **Wynik:** raport w `evidence/` z datą diagnozy, zakresem pytań, liczbą pytań (10), liczbą poprawnych odpowiedzi (10), wynikiem (20/20), interpretacją i ograniczeniem: test rozpoznawania pojęć nie dowodzi praktycznych kompetencji ani poziomu seniority.
- **Weryfikacja:** porównanie raportu z odpowiedziami w rozmowie; kontrola wszystkich pól AC-01 i review właściciela.
- **Dowód:** raport diagnostyczny, odniesienie do zapisu rozmowy i wynik review.
- **Stan początkowy:** odpowiedzi i ocena istnieją w rozmowie; raport w repo nie został zweryfikowany. Status zadania `TODO`; kontrola zapisu `NOT RUN`.

### T-02 — Opis ról i bramek (AC-02, AC-03)

- **Wynik:** macierz odpowiedzialności człowiek / ChatGPT / Claude Code / GitHub oraz opis wszystkich bramek `G0–G7`, w tym osobnych `G6` (gotowość dokumentacji, AC-06) i `G7` (zamknięcie lekcji, AC-07).
- **Weryfikacja:** review ról, odpowiedzialności i warunków blokady; scenariusze `S-01A–S-01E` raportowane w T-04.
- **Dowód:** zatwierdzony opis procesu, checklista bramek i review.
- **Status:** `TODO`.

### T-03 — Szablon zlecenia dla Claude Code (AC-04)

- **Wynik:** przykładowe zlecenie dokumentacyjne zgodne z `design.md` v0.2 §3: repo/branch/baseline SHA, zatwierdzone wersje SDD, cel, dozwolone pliki i działania, wykluczenia, AC, warunki ukończenia, metoda weryfikacji, dowody, warunki STOP i eskalacja.
- **Zakres:** szablon i przykład; nie uruchamiać implementacji na podstawie samego przykładu.
- **Weryfikacja:** checklista wszystkich pól kontraktu oraz review właściciela.
- **Dowód:** szablon, wypełniony przykład i checklista.
- **Status:** `TODO`.

### T-04 — Manualne kontrole procesu (AC-03, AC-05; NFR-04)

- **Wynik:** osobny rekord kontroli dla każdego wariantu: `S-01A–S-01E`, `S-02`, `S-03`, `S-04`, `S-06`, `S-07`, `S-09A–S-09D`, `S-10A–S-10C` (łącznie 17 wariantów). `S-05` i `S-08` należą do T-05.
- **Zakres:** symulacje decyzji na danych fikcyjnych; bez ujawniania sekretów, bez destrukcyjnych operacji i bez zmian kodu/CI.
- **Weryfikacja:** porównanie `expected` z `actual` dla każdego wariantu, ocena czterech statusów i uprawnień; `PASS` tylko z dowodem przeprowadzonej symulacji.
- **Dowód:** rekordy w `evidence/` zgodne z §1.5, review i lista brakujących dowodów.
- **Status:** `TODO`; scenariusze nie zostały jeszcze wykonane.

### T-05 — Review i zapis SDD, G6 (AC-06)

- **Wynik:** cztery zatwierdzone i spójne dokumenty w `specs/002-ai-workflow/`, raport review, zweryfikowany commit/PR i osobny raport `G6`.
- **Zakres:** tylko dokumentacja L02 i dowody; bez zmian kodu, CI i infrastruktury. Przed zapisem zsynchronizować metadane zatwierdzeń w lokalnych plikach.
- **Weryfikacja:** sprawdzić identyfikatory, wersje, statusy zatwierdzenia, mapowanie FR/NFR ↔ AC ↔ T, brak otwartych `Critical`/`Major`, wykonanie `S-05` (rozbieżność kopii lokalnej) i `S-08` (niedostępna rewizja) jako symulacji. Następnie odczytać **rzeczywistą zawartość** wszystkich czterech plików z określonej rewizji GitHub.
- **Raport G6:** `repository`, `branch`, `commit SHA`, `read_at`, lista czterech plików i wersji, wynik review, wyniki `S-05`/`S-08`, `AC-06` status i odnośniki do dowodów. Niedostępna rewizja = `BLOCKED`; lokalny plik lub sam commit bez kontroli treści nie daje `PASS`.
- **Dowód:** raport G6, wyniki scenariuszy, hash/link Git i potwierdzenie zawartości.
- **Status:** `TODO`.

### T-06 — Completion gate G7 i aktualizacja postępów (AC-07)

- **Wynik:** raport gotowości G7; po jawnej decyzji właściciela `Lesson 02: CLOSED` osobna aktualizacja `progress.md`.
- **Weryfikacja:** wszystkie `AC-01–AC-06` mają `PASS`, T-01–T-05 są `DONE`, brak otwartych `Critical`/`Major`, dowody Git są sprawdzone, decyzja właściciela istnieje. Bez decyzji — lekcja otwarta (`S-06`).
- **Dowód:** raport G7, jawna decyzja i zweryfikowany commit aktualizacji `progress.md`.
- **Status:** `TODO`.

## 3. Macierz zadanie → kryterium

| Zadanie | AC-01 | AC-02 | AC-03 | AC-04 | AC-05 | AC-06 | AC-07 |
|---|---|---|---|---|---|---|---|
| T-01 | X | | | | | | |
| T-02 | | X | X | | | | |
| T-03 | | | | X | | | |
| T-04 | | | X | | X | | |
| T-05 | | | | | | X | |
| T-06 | | | | | | | X |

**Przypisanie scenariuszy:** T-04 = S-01A–E, S-02, S-03, S-04, S-06, S-07, S-09A–D, S-10A–C; T-05 = S-05, S-08. S-06 jest także sprawdzany jako warunek T-06. Wymagania przekrojowe NFR-04 weryfikuje T-04; NFR-05 kontroluje T-05.

## 4. Warunki ukończenia i blokady

- [ ] Wszystkie cztery dokumenty SDD zostały zatwierdzone przez właściciela, a metadane zsynchronizowane.
- [ ] G0 `PASS`; każda operacja zapisu miała wymagane uprawnienia i zgodę.
- [ ] T-01–T-04 mają komplet raportów, wykonane kontrole i review.
- [ ] T-05 `DONE`: G6/AC-06 `PASS`, brak otwartych `Critical`/`Major`, rzeczywista zawartość dokumentów zweryfikowana na określonym SHA.
- [ ] AC-01–AC-06 mają udokumentowane `PASS`.
- [ ] T-06: raport G7 przedstawiony właścicielowi, a właściciel jawnie wydał decyzję `Lesson 02: CLOSED`.
- [ ] Dopiero po tej decyzji zaktualizowano `progress.md` i zweryfikowano jego commit.

**Stan przy sporządzeniu pierwotnego planu v0.2:** test diagnostyczny 20/20 był przeprowadzony, ale zadania dokumentacyjne i scenariusze manualne nie miały jeszcze dowodów. **Stan po lokalnym pre-review T-05 (2026-11-13):** właściciel zaakceptował raporty T-01–T-04; wykonano symulacje S-05 i S-08, lecz G0 i operacyjna weryfikacja G6 pozostają `BLOCKED`. Nie wykonywano testów aplikacji ani CI. Dokument v0.2 jest zatwierdzony w rozmowie, ale nie został zapisany w GitHub.
