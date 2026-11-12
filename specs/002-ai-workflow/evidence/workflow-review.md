# T-02 — Raport ról i bramek G0–G7 — Lekcja 02

- **Data sporządzenia:** 2026-11-13
- **Artefakt:** lokalny szkic do review; brak zapisu do GitHub.
- **Podstawa:** `requirements.md` v0.2 (FR-02–FR-10, NFR-01–NFR-05), `spec.md` v0.2 (AC-02, AC-03), `design.md` v0.2 (§1–§4), `tasks.md` v0.2 (T-02); wszystkie zatwierdzone merytorycznie przez właściciela w rozmowie, lokalne metadane `Draft` jeszcze niezsynchronizowane.
- **Baseline GitHub:** `borys94/tetris-multiplayer`, `main`; ostatni commit z wyszukiwania `99c5c39a78c638960cbc5259ccd20dfda3fed868` to **kandydat**, nie potwierdzony HEAD. G0: `BLOCKED` — szczegóły `g0-baseline.md`.
- **AC:** AC-02, AC-03. **Zadanie:** T-02.

## 1. Macierz odpowiedzialności

| Działanie / decyzja | Właściciel / Tech Lead | ChatGPT | Claude Code | GitHub |
|---|---|---|---|---|
| Definicja celu, zakresu i priorytetów | Decyduje | Proponuje, analizuje ryzyka | Nie rozszerza zakresu | Przechowuje zatwierdzony zapis |
| Przygotowanie `requirements.md`, `spec.md`, `design.md`, `tasks.md` | Zatwierdza każdy artefakt | Przygotowuje projekty i review | Może edytować tylko na zatwierdzone zlecenie | Wersjonuje artefakty |
| Zatwierdzenie zmiany architektury / nowej istotnej zależności | Podejmuje decyzję | Analizuje kompromisy, proponuje ADR | Zatrzymuje pracę i eskaluje | Wersjonuje decyzję/ADR |
| Wykonanie zadania w zatwierdzonym zakresie | Autoryzuje zakres i wymagany zapis | Przygotowuje zlecenie, może przygotować lokalne raporty | Wykonuje zlecone czynności i raportuje | Przechowuje diff/commit/PR |
| Weryfikacja i review | Rozstrzyga akceptację | Ocenia zgodność, ryzyka i dowody | Raportuje rzeczywiste kontrole, nie zatwierdza własnej pracy | Umożliwia odczyt i audyt dowodów |
| Zamknięcie lekcji i `progress.md` | Wyłącznie właściciel wydaje decyzję `Lesson 02: CLOSED` | Sprawdza kompletność G7 | Nie zamyka samodzielnie lekcji | Przechowuje późniejszy commit `progress.md` |

GitHub jest systemem przechowywania wersji, a nie samodzielnym decydentem. ChatGPT i Claude Code nie zastępują akceptacji właściciela. Zatwierdzenie treści SDD nie stanowi zgody na zapis do GitHub.

## 2. Bramki procesu

| Bramka | Warunek wejścia / kontrola | Wynik i reakcja na niespełnienie | Decydent |
|---|---|---|---|
| **G0 — Baseline** | Repozytorium, gałąź, aktualny SHA HEAD lub jednoznaczna rewizja, data odczytu, porównanie `syllabus.md`, `progress.md`, właściwych specyfikacji | `PASS` tylko przy potwierdzeniu rewizji; inaczej `BLOCKED` i brak decyzji zależnych od niezweryfikowanego stanu | ChatGPT weryfikuje, właściciel rozstrzyga dalszy zakres |
| **G1 — Requirements** | Jawna akceptacja zakresu, wykluczeń i wymagań | Brak akceptacji blokuje zadanie zmieniające repozytorium | Właściciel |
| **G2 — Specification** | Jawna akceptacja AC, scenariuszy i traceability | Brak akceptacji blokuje zadanie zmieniające repozytorium | Właściciel |
| **G3 — Design** | Jawna akceptacja mechanizmów, kompromisów, ryzyk i uprawnień | Brak akceptacji blokuje zadanie zmieniające repozytorium | Właściciel |
| **G4 — Tasks** | Jawna akceptacja `tasks.md`, mapowania T ↔ AC, zakresu i dowodów | Brak akceptacji lub niezatwierdzona zmiana zakresu: `BLOCKED`; ponowna akceptacja odpowiednich artefaktów | Właściciel |
| **G5 — Review** | Rzeczywiste wyniki kontroli i dowody; klasyfikacja uwag | `Critical`/`Major` otwarte: brak pozytywnego review; niewykonane kontrole to nie `PASS` | Recenzent i właściciel |
| **G6 — Documentation Ready** | Cztery zatwierdzone i spójne dokumenty na zweryfikowanym SHA Git, mapowanie AC ↔ T, review bez otwartych `Critical`/`Major` | `AC-06 PASS` tylko po kontroli zawartości Git; niedostępna rewizja: `BLOCKED`; G6 nie zamyka lekcji | Właściciel |
| **G7 — Lesson Closure** | AC-01–AC-06 `PASS`, T-01–T-05 `DONE`, komplet dowodów i jawna decyzja `Lesson 02: CLOSED` | Bez decyzji lekcja pozostaje otwarta; dopiero potem osobna aktualizacja `progress.md` i weryfikacja commita | Właściciel |

**Ścieżka:** G0 → G1 → G2 → G3 → G4 → zatwierdzone zadanie → dowody → G5 → G6 → G7 → aktualizacja `progress.md`.

## 3. Uprawnienia i zatrzymanie pracy

- Niedestrukcyjny zapis w zatwierdzonym zakresie i przy odpowiednich uprawnieniach może być wykonany w ramach zlecenia; w tej sesji obowiązuje dodatkowa jawna dyspozycja właściciela: **bez zmian w GitHub do osobnej zgody**.
- Usunięcie istniejącego pliku lub inna operacja destrukcyjna wymaga osobnej zgody właściciela, nawet w zatwierdzonym zakresie.
- Zapis poza zakresem wymaga zatrzymania, zgody oraz ponownej akceptacji SDD, jeśli zakres się zmienia.
- Nowa istotna zależność lub zmiana architektury wymaga STOP, analizy i decyzji właściciela; ADR, gdy właściwy.
- Sekretów nie umieszcza się w promptach ani raportach; używa się odpowiednich uprawnień i redakcji.
- Status kontroli: `NOT RUN` (nie wykonano), `PASS` (wykonano i udowodniono), `FAIL` (wykonano, kryterium niespełnione), `BLOCKED` (brak możliwości wiarygodnej oceny). Status zadania: `TODO`, `IN PROGRESS`, `BLOCKED`, `DONE` — niezależny od statusów kontroli.

## 4. Kontrola T-02 (autorska; do review właściciela)

| ID | Oczekiwanie | Obserwacja w raporcie | Metoda | Status |
|---|---|---|---|---|
| T02-C01 / AC-02 | Właściciel zatwierdza cztery SDD, decyzje architektoniczne i zamknięcie; AI nie akceptuje własnej pracy | Opisano w macierzy §1 | Porównanie z `requirements.md` v0.2 §2–§3 i `spec.md` v0.2 AC-02 | `PASS` (kontrola autora) |
| T02-C02 / AC-03 | Każdy brak akceptacji G1–G4 i zmiana zakresu blokują zadanie zmieniające repo | Opisano w §2 i §3 | Porównanie z `spec.md` v0.2 AC-03, S-01A–E | `PASS` (kontrola treści; scenariusze `NOT RUN`) |
| T02-C03 | G0–G7, osobne G6/AC-06 i G7/AC-07 | Wszystkie osiem bramek ujęto w §2 | Porównanie z `design.md` v0.2 §2 | `PASS` (kontrola autora) |
| T02-C04 | Brak zapisu GitHub i uczciwe raportowanie G0 | Zapisano ograniczenia i G0 `BLOCKED` | Porównanie z `g0-baseline.md` i dyspozycją właściciela | `PASS` (kontrola treści) |

**Dowód:** niniejszy lokalny raport oraz zatwierdzone w rozmowie dokumenty SDD v0.2. **Reviewer:** właściciel — oczekuje na review. **Metoda:** statyczne porównanie treści, nie symulacja operacyjna. Scenariusze S-01A–E należą do T-04 i pozostają `NOT RUN`; ich wyników nie należy wnioskować z samego opisu bramek.

## 5. Stan i blokady

- **T-01:** raport lokalny zaakceptowany przez właściciela w rozmowie; niepotwierdzony zapis GitHub nie jest wymagany na tym etapie.
- **T-02:** `IN PROGRESS` — raport przygotowany lokalnie; oczekuje na review właściciela.
- **AC-02:** weryfikacja treści przez autora `PASS`; akceptacja właściciela oczekuje.
- **AC-03:** opis mechanizmu sprawdzony, ale scenariusze S-01A–E `NOT RUN` (T-04), więc AC-03 nie ma jeszcze pełnego `PASS`.
- **G0:** `BLOCKED` — brak potwierdzenia HEAD `main`; nie zmieniać statusu na podstawie samego wyszukiwania commitów.
- **G6/G7:** `NOT RUN`; repozytorium GitHub bez zmian.
- **Testy aplikacji / CI:** `NOT RUN` — poza zakresem lekcji 02.
