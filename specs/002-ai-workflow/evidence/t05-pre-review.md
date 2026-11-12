# T-05 — Lokalny pre-review dokumentacji SDD i gotowości G6

- **ID:** `002-ai-workflow/T-05`
- **Data:** 2026-11-13
- **Rodzaj:** lokalny pre-review; bez zapisu do GitHub
- **Repozytorium / gałąź:** `borys94/tetris-multiplayer` / `main`
- **G0:** `BLOCKED` — brak potwierdzenia HEAD `main`; SHA `99c5c39a78c638960cbc5259ccd20dfda3fed868` to jedynie ostatni wynik wyszukiwania commitów, nie zweryfikowana referencja gałęzi.
- **Podstawa:** lokalne `requirements.md`, `spec.md`, `design.md`, `tasks.md` v0.2, zaakceptowane w rozmowie; raporty T-01–T-04 zaakceptowane przez właściciela w rozmowie.
- **Status zadania T-05:** `BLOCKED` dla etapu zapisu/weryfikacji GitHub; lokalny pre-review wykonany.
- **AC-06 / G6:** `BLOCKED` — brak autoryzacji zapisu i dowodu odczytu czterech plików z określonej rewizji GitHub.

## 1. Zakres sprawdzenia

Sprawdzono lokalnie cztery dokumenty SDD v0.2: identyfikator `002-ai-workflow`, wersje, zakres dokumentacyjny, definicje AC-01–AC-07, macierz AC ↔ T, bramki G0–G7, scenariusze i zależności. Odczyty repozytorium z poprzedniego G0 wskazują `progress.md` jako 1/60 i L02 „Nie rozpoczęto”, a `specs/002-ai-workflow/requirements.md` jako nieistniejący na `main`. Nie weryfikowano zawartości czterech dokumentów na commicie, ponieważ nie zostały zapisane.

| Kontrola | Rezultat | Uzasadnienie |
|---|---|---|
| ID i wersje czterech dokumentów | `PASS` (statycznie) | Każdy ma ID `002-ai-workflow` i wersję 0.2 |
| AC-01–AC-07 ↔ T-01–T-06 | `PASS` (statycznie) | Macierz w `tasks.md` v0.2 obejmuje wszystkie siedem AC |
| Przypisanie scenariuszy | `PASS` (statycznie) | T-04: 17 wariantów; T-05: S-05 i S-08 |
| Zakres i rozdzielenie G6/G7 | `PASS` (statycznie) | Dokumentacja L02; zamknięcie dopiero po decyzji właściciela |
| Spójność metadanych zatwierdzenia | `FAIL` (statycznie) | Wszystkie cztery lokalne nagłówki nadal zawierają `Draft`, mimo zatwierdzenia w rozmowie |
| Aktualność odniesień między dokumentami | `FAIL` (statycznie) | `spec.md` v0.2 i `design.md` v0.2 zawierają historyczne stwierdzenia o `tasks.md` v0.1; `spec.md` opisuje też `design.md` v0.1 jako Draft |
| Potwierdzenie HEAD `main` | `BLOCKED` | Brak wiarygodnego odczytu referencji gałęzi |
| Zapis i weryfikacja czterech plików na SHA | `NOT RUN` | Brak osobnej zgody na zapis; dokumenty nie są jeszcze w GitHub |
| Testy aplikacji / CI | `NOT RUN` | Poza zakresem L02 |

## 2. Scenariusz S-05 — Rozbieżność lokalnej kopii i GitHub

- **scenario_id:** `S-05`
- **date:** 2026-11-13
- **input_or_initial_state:** fikcyjna lokalna kopia `progress.md` deklaruje L02 „W trakcie”, a plik GitHub na *jednoznacznie zidentyfikowanym SHA* deklaruje „Nie rozpoczęto”.
- **expected:** wskazać repozytorium, gałąź, SHA, datę odczytu, rozbieżność; oprzeć decyzje o stanie repozytorium na zweryfikowanej rewizji GitHub.
- **actual:** w ręcznej symulacji decyzja brzmi: „nie utożsamiaj kopii lokalnej z GitHub; wskaż różnicę i wymagaj identyfikacji rewizji”. Rzeczywisty odczyt `progress.md` z `main` wykazał L02 „Nie rozpoczęto”, ale nie dostarczył potwierdzonego HEAD SHA.
- **method_or_command:** tabletop/manualne zastosowanie reguły `spec.md` v0.2 §2, S-05; dodatkowo analiza wcześniejszego raportu G0.
- **status:** `PASS` dla symulacji reguły; **`BLOCKED` dla operacyjnego potwierdzenia S-05**, ponieważ nie spełniono przesłanki jednoznacznie zidentyfikowanej rewizji.
- **evidence_link_or_missing_reason:** ten rekord; `g0-baseline.md`; brak dowodu HEAD SHA.
- **repository/branch/SHA_or_file_version:** `borys94/tetris-multiplayer/main`; HEAD SHA niepotwierdzony; `spec.md` v0.2.
- **reviewer:** właściciel — oczekuje na review niniejszego raportu.
- **blocker:** G0 `BLOCKED`.

## 3. Scenariusz S-08 — Niedostępna rewizja GitHub

- **scenario_id:** `S-08`
- **date:** 2026-11-13
- **input_or_initial_state:** fikcyjna sytuacja: nie można odczytać lub jednoznacznie zidentyfikować właściwej rewizji GitHub; analogiczne ograniczenie dotyczy aktualnego G0.
- **expected:** weryfikacja stanu dokumentów = `BLOCKED`, podać przyczynę, brakujące dane i działanie; nie przedstawiać lokalnych plików jako aktualnej treści GitHub.
- **actual:** ręcznie zastosowano `BLOCKED`; wskazano brak potwierdzonego HEAD `main` i konieczność odczytu referencji gałęzi przed zapisem. Lokalnych plików nie uznano za wersje GitHub.
- **method_or_command:** tabletop/manualne zastosowanie reguły `spec.md` v0.2 §2, S-08; porównanie z G0.
- **status:** `PASS` dla symulacji poprawnej reakcji; **weryfikacja GitHub pozostaje `BLOCKED`**.
- **evidence_link_or_missing_reason:** ten rekord; `g0-baseline.md`; brak odczytu referencji `refs/heads/main`.
- **repository/branch/SHA_or_file_version:** `borys94/tetris-multiplayer/main`; HEAD SHA niepotwierdzony; `spec.md` v0.2.
- **reviewer:** właściciel — oczekuje.
- **blocker:** G0 `BLOCKED`.

## 4. Uwagi code/document review

### Major — M-01
- **Pliki:** `requirements.md`, `spec.md`, `design.md`, `tasks.md` v0.2.
- **Problem:** nagłówki wciąż mówią `Draft — ... niezatwierdzony`, choć właściciel zatwierdził wszystkie cztery w rozmowie.
- **Ryzyko:** publikacja niejednoznacznego pakietu; G6 nie może potwierdzić zgodnych metadanych akceptacji.
- **Poprawka:** w kopiach przygotowanych do zapisu zmienić status na `Approved — zatwierdzono w rozmowie L02` i zachować wersję 0.2, o ile zmiany pozostaną czysto metadanymi.
- **Weryfikacja:** odczytać nagłówki wszystkich czterech plików po korekcie i ponownie przeprowadzić review.

### Major — M-02
- **Pliki:** `spec.md` v0.2, `design.md` v0.2.
- **Problem:** tekst zawiera historyczne informacje, że `tasks.md` v0.1 wymaga aktualizacji, a w `spec.md` także że `design.md` v0.1 jest Draft. To nie opisuje już zatwierdzonego stanu pakietu v0.2.
- **Ryzyko:** sprzeczne informacje o stanie G3/G4 i niejednoznaczność śladu audytowego.
- **Poprawka:** skorygować wyłącznie historyczne zdania o statusie innych dokumentów, nie zmieniając treści AC, scenariuszy ani zakresu; zachować historię w raporcie review.
- **Weryfikacja:** wyszukać odniesienia do `tasks.md v0.1`, `design.md v0.1` i sprawdzić ich aktualność po korekcie.

### Major — M-03
- **Plik:** `g0-baseline.md` / G6 report.
- **Problem:** nie potwierdzono HEAD `main`; brak docelowego SHA i odczytu czterech plików po zapisie.
- **Ryzyko:** fałszywe przypisanie lokalnej dokumentacji do konkretnej rewizji GitHub.
- **Poprawka:** uzyskać wiarygodny odczyt HEAD `main`; po osobnej zgodzie na zapis odczytać wszystkie cztery dokumenty na wskazanym SHA i porównać ich treść.
- **Weryfikacja:** raport G0 `PASS`, odczyty czterech ścieżek z `ref=<SHA>`, udokumentowane porównanie i raport G6.

### Minor — m-01
- **Plik:** `tasks.md` v0.2.
- **Problem:** tabela i sekcje zadań nadal opisują początkowe `TODO` i brak dowodów; po zaakceptowaniu lokalnych raportów T-01–T-04 informacje są historyczne.
- **Ryzyko:** czytelnik pomyli stan planu w chwili jego utworzenia z aktualnym wykonaniem.
- **Poprawka:** pozostawić pierwotny plan jako baseline lub oznaczyć sekcję jako „stan przy sporządzeniu”; bieżący stan i dowody przechowywać w `evidence/` oraz raporcie G6. Nie aktualizować `progress.md` przed G7.
- **Weryfikacja:** sprawdzić, że raport G6 jednoznacznie rozdziela plan od wyników.

## 5. Warunki dalszego działania i status G6

1. Review właściciela niniejszego raportu i decyzja o korektach redakcyjnych M-01/M-02.
2. Utrzymać G0 `BLOCKED` do uzyskania potwierdzenia HEAD `main`; nie wykonywać zapisu.
3. Po G0 `PASS` i **osobnej zgodzie** na zapis: zsynchronizować metadane zatwierdzenia, skorygować historyczne odniesienia, dołączyć raporty dowodowe, zapisać w zatwierdzonym zakresie.
4. Odczytać cztery dokumenty SDD z konkretnego SHA GitHub, porównać zawartość, zamknąć uwagi `Major` i sporządzić pełny raport G6.
5. Dopiero wtedy ocenić AC-06. Bez tych dowodów **G6 = `BLOCKED`**, T-05 nie jest `DONE`, a G7 i aktualizacja `progress.md` nie są dopuszczalne.

**Podsumowanie:** lokalna spójność struktury i śledzenia AC↔T jest wstępnie potwierdzona; S-05 i S-08 zaliczone wyłącznie jako ręczne symulacje reakcji. Nie ma dowodu operacyjnego spełnienia AC-06. GitHub nie został zmieniony.
