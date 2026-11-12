# Design — architektura procesu AI-assisted SDD

- **ID:** `002-ai-workflow`
- **Wersja:** 0.2
- **Status:** Approved — zatwierdzono przez właściciela w rozmowie L02 (2026-11-13); zapis do GitHub nieautoryzowany
- **Podstawa:** `requirements.md`, `spec.md` i `tasks.md` v0.2 — zatwierdzone przez właściciela w rozmowie L02; historia review `design.md` v0.1 i 8 zaakceptowanych uwag. Zapis do GitHub wymaga odrębnej zgody.
- **Zakres:** organizacja współpracy AI i weryfikacja dokumentacyjna L02; bez kodu aplikacji, CI i infrastruktury.

## 1. Przepływ i odpowiedzialność

```text
G0: GitHub baseline (repo, branch, SHA, read date, verification status)
  -> G1: requirements.md [akceptacja właściciela]
  -> G2: spec.md         [akceptacja właściciela]
  -> G3: design.md       [akceptacja właściciela]
  -> G4: tasks.md        [akceptacja właściciela]
  -> zlecenie w zatwierdzonym zakresie -> Claude Code
  -> raport kontroli i dowody -> G5: review
  -> G6: gotowość dokumentacji (AC-06, Git SHA)
  -> G7: decyzja o zamknięciu (AC-07)
  -> commit progress.md (dopiero po decyzji)
```

Właściciel jest jedyną osobą zatwierdzającą zakres, dokumenty, istotne zmiany i zamknięcie lekcji. ChatGPT proponuje rozwiązania i recenzuje; Claude Code realizuje tylko zatwierdzone zadania i raportuje rzeczywiste wyniki. GitHub stanowi wersjonowane źródło prawdy. Przed zatwierdzeniem G4 nie zlecamy zadań zmieniających repozytorium. Samo zatwierdzenie dokumentów w rozmowie nie stanowi zgody na zapis do GitHub.

## 2. Bramki G0–G7

| Bramka | Właściciel / kontrolujący | Warunek i rezultat |
|---|---|---|
| G0 — Baseline | ChatGPT + właściciel | Zapis: `repository`, `branch`, `commit SHA` (lub jednoznaczna rewizja), `read_at`, `status`, ewentualne rozbieżności. `PASS` tylko przy wiarygodnej weryfikacji; inaczej `BLOCKED` z przyczyną i brakującymi danymi. Przy `BLOCKED` nie wolno przedstawiać kopii lokalnej jako stanu GitHub ani podejmować decyzji zależnych od niezweryfikowanej rewizji (S-05, S-08). |
| G1 — Requirements | Właściciel | Jawna akceptacja wymagań, zakresu i wykluczeń. |
| G2 — Specification | Właściciel | Jawna akceptacja testowalnych AC, scenariuszy, śledzenia wymagań i odroczeń. |
| G3 — Design | Właściciel | Jawna akceptacja mechanizmów, kompromisów, ryzyk i uprawnień. |
| G4 — Tasks | Właściciel | Jawna akceptacja `tasks.md`, mapowania T ↔ AC, zakresu i dowodów. Brak dowolnej z akceptacji G1–G4 = `BLOCKED` dla zadania zmieniającego repozytorium (S-01A–E). Zmiana zakresu wymaga ponownej akceptacji odpowiednich dokumentów. |
| G5 — Review | Recenzent + właściciel | Kontrole wykonane i opisane; uwagi `Critical`/`Major` rozwiązane; brak dowodów nie daje `PASS`. |
| G6 — Documentation ready | Właściciel | **AC-06:** wszystkie cztery dokumenty zatwierdzone i spójne, mapowanie AC ↔ T sprawdzone, dokumenty zapisane i zweryfikowane na określonej rewizji Git, brak otwartych `Critical`/`Major`. Wynik `PASS` albo stan niezaliczony z uzasadnieniem; niedostępna rewizja = `BLOCKED`. G6 nie zamyka lekcji. |
| G7 — Lesson closure | Właściciel | **AC-07:** wszystkie AC-01–AC-06 `PASS`, zadania wykonane, dowody zweryfikowane i jawna decyzja `Lesson 02: CLOSED`. Dopiero wtedy dopuszczalna aktualizacja `progress.md`, której commit jest osobnym dowodem. Brak decyzji = lekcja otwarta (S-06). |

W L02 wykonanie po G4 dotyczy wyłącznie zatwierdzonych zmian dokumentacyjnych i kontroli manualnych. Nie wymagamy testów aplikacji ani CI, których nie przewidziano dla tego zakresu.

## 3. Kontrakt zadania Claude Code i zasady zapisu

Każde zlecenie zawiera: kontekst (`repo`, `branch`, `baseline SHA`, zatwierdzone dokumenty), cel, dozwolone pliki i działania, wykluczenia, AC, warunki ukończenia, metodę weryfikacji, oczekiwane dowody oraz warunki zatrzymania i eskalacji. Raport podaje rzeczywisty diff, uruchomione kontrole i statusy; nie wymyśla testów, commitów ani akceptacji.

**Przykładowe zlecenie (szablon, nie autoryzacja wykonania):**

```text
Task: T-03 — przygotowanie przykładowego zlecenia AI (AC-04)
Baseline: borys94/tetris-multiplayer, main, <zweryfikowany SHA>
Approved: requirements.md v0.2, spec.md v0.2, design.md v0.2,
          tasks.md <zatwierdzona wersja>; przed G4: STOP
Goal: zapisz szablon zlecenia zgodny z AC-04
In scope: wyłącznie ścieżki wskazane w zatwierdzonym tasks.md
Out of scope: kod gry, CI, zależności, infrastruktura, progress.md
Verification: manualne porównanie szablonu z AC-04 i FR-05
Evidence: diff, ID kontroli, expected/actual, status, link do dowodu
Escalation: STOP przy nowym pliku poza zakresem, usunięciu pliku,
            nowej zależności, zmianie architektury lub braku baseline
Do not: ujawniać sekretów, deklarować nieuruchomionych testów
```

**Uprawnienia (NFR-04; S-10A–C):**

| Operacja | Reguła |
|---|---|
| Niedestrukcyjny zapis w zatwierdzonym zakresie i z właściwymi uprawnieniami | Dopuszczalny w ramach zatwierdzonego zlecenia; bez odrębnej zgody na każdą edycję. |
| Usunięcie istniejącego pliku lub inna operacja destrukcyjna | STOP i osobna jawna zgoda właściciela, nawet gdy plik znajduje się w zakresie. |
| Zapis poza zatwierdzonym zakresem | STOP i osobna jawna zgoda; gdy zmienia zakres SDD — ponowna akceptacja odpowiednich artefaktów. |
| Sekret w kontekście lub prompcie | Nie przekazywać wartości; zastosować odpowiednie uprawnienia i redakcję danych (S-07). |

Zatwierdzenie projektu technicznego nie jest samo w sobie pozwoleniem na dowolną operację w repozytorium.

## 4. Model dowodów i review

Szczegółowe raporty umieszczamy po zatwierdzeniu i wykonaniu zadań w `specs/002-ai-workflow/evidence/`; `progress.md` przechowuje wyłącznie zwięzły status, identyfikatory i odnośniki do dowodów/commitów. Nie deklarujemy istnienia plików przed ich faktycznym zapisaniem.

**Minimalny rekord scenariusza:** `scenario_id`, `date`, `input_or_initial_state`, `expected`, `actual`, `method_or_command`, `status`, `evidence_link_or_missing_reason`, `repository/branch/SHA_or_file_version`, `reviewer`, `blocker` (gdy dotyczy).

| Status | Znaczenie |
|---|---|
| `PASS` | Kontrola wykonana, kryterium spełnione, wystarczające dowody. |
| `FAIL` | Kontrola wykonana i stwierdzono niespełnienie kryterium. |
| `NOT RUN` | Kontrola nie została wykonana; podać przyczynę. |
| `BLOCKED` | Przeszkoda uniemożliwia wykonanie lub wiarygodną ocenę; podać przeszkodę i brakujące dowody. |

Dla S-09A–D wypełniamy osobne rekordy, rozróżniając `expected` i `actual`. Review każdej uwagi zawiera poziom (`Critical`/`Major`/`Minor`/`Suggestion`), plik, problem, ryzyko, poprawkę i sposób weryfikacji. Brak uwag nie oznacza automatycznie `PASS` testów.

## 5. Decyzje i kompromisy

Identyfikatory odpowiadają rejestrowi z `requirements.md` v0.2 (§6.2):

| ID | Decyzja | Alternatywa / koszt / korzyść |
|---|---|---|
| D-02-01 | GitHub jako wersjonowane źródło prawdy | Lokalny stan lub czat: szybciej, lecz brak gwarancji aktualności. Koszt: weryfikacja SHA; korzyść: odtwarzalność. |
| D-02-02 | Człowiek zatwierdza zakres i podejmuje decyzje końcowe | Autonomiczne zatwierdzanie AI: mniejszy narzut, ale słabsza odpowiedzialność. |
| D-02-03 | Implementacja dopiero po G1–G4; ponowna akceptacja zmian zakresu | Jedno duże polecenie AI: mniej koordynacji, lecz większy scope creep. Małe zadania ułatwiają review i cofnięcie zmian. |
| D-02-04 | Dowody szczegółowe w `evidence/`, statusy i linki w `progress.md` | Wszystko w dzienniku: prostsza lokalizacja, ale rosnący szum i gorsza audytowalność. |

To decyzje procesowe, nie ADR architektury aplikacji. Formalizację ADR pozostawiamy na L04.

## 6. Ryzyka i zabezpieczenia

| Ryzyko | Zabezpieczenie / scenariusz |
|---|---|
| Niedostępna lub rozbieżna rewizja GitHub | G0 `BLOCKED` / jawna rozbieżność, S-05 i S-08 |
| Rozpoczęcie pracy przed zatwierdzeniem `tasks.md` | G4, S-01D i S-01E |
| AI deklaruje sukces bez wykonania kontroli | Statusy i dowody, S-02, S-03, S-09A–D |
| Rozszerzenie zakresu, zależność, zmiana architektury | STOP i decyzja właściciela, S-04; ADR jeśli właściwy |
| Nieautoryzowane usunięcie lub zapis | Macierz uprawnień, S-10A–C |
| Ujawnienie sekretów | Redakcja danych i uprawnienia, S-07 |
| Zbyt wczesne zamknięcie lekcji | Rozdzielenie G6/G7, S-06 |
| Zbyt ciężki proces dla dokumentacji | Krótkie artefakty, manualne kontrole; wyjątki tylko po jawnej zgodzie właściciela |

## 7. Powiązanie projektu z kryteriami akceptacji

| AC | Mechanizm | Metoda kontroli |
|---|---|---|
| AC-01 | Raport diagnostyczny w `evidence/`, minimalny rekord | Review kompletności danych diagnozy |
| AC-02 | Podział ról i G1–G7 | Review macierzy odpowiedzialności |
| AC-03 | G1–G4 i ponowna akceptacja | S-01A–S-01E |
| AC-04 | Kontrakt i przykład zlecenia (§3) | Review FR-05 i przykładu |
| AC-05 | Statusy, dowody i eskalacja (§3–4) | S-02–S-04, S-09A–S-09D |
| AC-06 | G0, G5, G6, śledzenie AC ↔ T, SHA | S-05, S-08, review dokumentów i Git |
| AC-07 | G7, decyzja właściciela, commit `progress.md` | S-06 i raport zamknięcia |

Wymagania przekrojowe: `NFR-04` — S-07 i S-10A–C; `NFR-05` — manualny, dokumentacyjny charakter L02. `tasks.md` v0.2 uwzględnia wszystkie wymagane scenariusze i zostało zatwierdzone w rozmowie L02.

## 8. Odroczenia i status

Monorepo — L03; formalne szablony ADR — L04; CI i branch protection — L05. Nie wykonano testów aplikacji ani CI. Scenariusze manualne są zdefiniowane, ale nie zostały tutaj wykonane. `AC-06` i `AC-07` nie mają `PASS`. Niniejszy dokument został zatwierdzony w rozmowie L02; lokalna korekta redakcyjna nie została zapisana w GitHub.
