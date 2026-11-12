# T-03 — Kontrakt zadania Claude Code — Lekcja 02

- **Data:** 2026-11-13
- **Status:** `IN PROGRESS` — lokalny projekt do review właściciela; nie jest poleceniem wykonania.
- **Źródła:** `requirements.md` v0.2 (`FR-05`, `FR-06`, `FR-08`, `NFR-04`), `spec.md` v0.2 (`AC-04`, `S-04`, `S-07`, `S-10A–C`), `design.md` v0.2 (§3–4), `tasks.md` v0.2 (`T-03`). Dokumenty zatwierdzone w rozmowie; nie zapisane w GitHub.
- **G0:** `BLOCKED` — brak niezależnego potwierdzenia aktualnego HEAD `main`. Commit `99c5c39a78c638960cbc5259ccd20dfda3fed868` jest wyłącznie kandydatem baseline.
- **Zapis GitHub:** zabroniony do odrębnej zgody właściciela. W tym zadaniu nie uruchamiać Claude Code.

## 1. Szablon kontraktu (do wypełnienia i osobnego autoryzowania)

```text
TASK_ID: <T-xx>
TASK_TITLE: <krótki tytuł>
AUTHORIZATION: <jawna decyzja właściciela, zakres i data>
BASELINE:
  repository: <owner/repo>
  branch: <branch>
  head_sha: <zweryfikowany HEAD SHA — bez placeholdera przed wykonaniem>
  read_at: <czas odczytu>
  verification_status: PASS
APPROVED_SDD:
  requirements: <ścieżka, wersja, zatwierdzenie>
  spec: <ścieżka, wersja, zatwierdzenie>
  design: <ścieżka, wersja, zatwierdzenie>
  tasks: <ścieżka, wersja, zatwierdzenie>
GOAL: <obserwowalny rezultat>
ALLOWED_PATHS: <zamknięta lista ścieżek lub jednoznaczny glob>
ALLOWED_ACTIONS: <konkretne działania>
OUT_OF_SCOPE: <zakazy i odroczenia>
AC_LINKS: <AC-xx i scenariusze>
DONE_WHEN: <mierzalne warunki ukończenia>
VERIFICATION: <konkretne metody i polecenia, jeżeli istnieją>
EVIDENCE: <diff, raport expected/actual, status, identyfikator kontroli, link/ścieżka>
REPORT: <zmienione pliki, wynik każdej kontroli, testy NOT RUN z przyczyną, ryzyka>
STOP_AND_ESCALATE: <G0 BLOCKED; brak G1–G4; niezgodność SHA; zakres; operacje destrukcyjne; nowe zależności; zmiana architektury; sekrety>
WRITE_PERMISSION: <jawny zakres upoważnienia; destrukcyjne i poza zakresem osobno>
```

**Warunki wejścia do wykonania:** G0 `PASS` na potwierdzonym HEAD i ponowna kontrola przed pracą; G1–G4 zatwierdzone; osobna zgoda właściciela na zapis; brak rozbieżności w wersjach SDD. W przeciwnym razie `BLOCKED` i brak zapisu.

**Zasada dowodowa:** status `PASS` tylko dla faktycznie przeprowadzonej kontroli z dowodem. `NOT RUN` oznacza niewykonanie, `FAIL` wynik negatywny, `BLOCKED` niemożność wiarygodnej oceny. Nie twórz fikcyjnych wyników, commitów, PR ani deklaracji testowych.

## 2. Wypełniony przykład — dokumentacyjny, NIE URUCHAMIAĆ

```text
TASK_ID: L02-T05-DOC-PREP
TASK_TITLE: Przygotowanie czterech dokumentów SDD lekcji 02 do zapisu
AUTHORIZATION: BRAK — wymagane odrębne upoważnienie właściciela
BASELINE:
  repository: borys94/tetris-multiplayer
  branch: main
  head_sha: NIEPOTWIERDZONY (G0 BLOCKED)
  candidate_sha: 99c5c39a78c638960cbc5259ccd20dfda3fed868
  read_at: 2026-11-13 (bez potwierdzonej godziny)
  verification_status: BLOCKED
APPROVED_SDD:
  requirements: specs/002-ai-workflow/requirements.md v0.2 — approved w rozmowie
  spec: specs/002-ai-workflow/spec.md v0.2 — approved w rozmowie
  design: specs/002-ai-workflow/design.md v0.2 — approved w rozmowie
  tasks: specs/002-ai-workflow/tasks.md v0.2 — approved w rozmowie
GOAL: Ujednolicić nagłówki Approved i odnośniki wersji w czterech dokumentach.
ALLOWED_PATHS:
  specs/002-ai-workflow/requirements.md
  specs/002-ai-workflow/spec.md
  specs/002-ai-workflow/design.md
  specs/002-ai-workflow/tasks.md
ALLOWED_ACTIONS: Wyłącznie redakcja metadanych i niespójnych odwołań
  między zatwierdzonymi wersjami; bez zmiany treści normatywnej.
OUT_OF_SCOPE: kod aplikacji, CI, zależności, infrastruktura, ADR,
  progress.md, usuwanie plików, rozszerzanie SDD i zamknięcie lekcji.
AC_LINKS: AC-04 (jakość kontraktu); AC-06 (przyszła kontrola dokumentacji).
DONE_WHEN: Cztery dokumenty mają status Approved v0.2,
  poprawne wzajemne referencje i niezmienione wymagania/AC/zadania.
VERIFICATION: Ręczne porównanie metadanych i diffu; kontrola
  odnośników wersji; po autoryzowanym zapisie weryfikacja SHA i treści.
EVIDENCE: lista plików, diff, expected/actual, metoda, status,
  odnośnik do rzeczywistego commita dopiero po jego utworzeniu.
REPORT: Każda wykonana kontrola i jej wynik; brak testów aplikacji = NOT RUN.
STOP_AND_ESCALATE: G0 BLOCKED, brak osobnej zgody, zmiana HEAD,
  brak G1–G4, nowe pliki, zmiana zakresu lub semantyki, usunięcie,
  nowe zależności, zmiana architektury, sekret w danych.
WRITE_PERMISSION: BRAK — przykład nie upoważnia do zapisu.
EXECUTION_DECISION: BLOCKED — NIE URUCHAMIAĆ.
```

**Uwaga o zakresie:** przykład przedstawia przyszły fragment T-05, nie jest dodatkowym zadaniem w `tasks.md`. Nie uruchamia się go na podstawie zatwierdzenia T-03. Przed rzeczywistym wykonaniem wymaga aktualnego baseline, decyzji właściciela i weryfikacji, że proponowane edycje są czysto redakcyjne.

## 3. Checklista kontroli autora — do review

| ID | Oczekiwane | Rzeczywiste | Metoda | Status |
|---|---|---|---|---|
| T03-C01 / AC-04 | Cel, zakres, wykluczenia, AC, ukończenie i dowody | Pola obecne w szablonie i przykładzie | Porównanie z FR-05 / AC-04 | `PASS` (kontrola treści autora) |
| T03-C02 | Repo, branch, zweryfikowany SHA, wersje czterech SDD | Szablon wymaga; przykład jawnie oznacza brak SHA HEAD | Porównanie z design §3 i G0 | `PASS` (kontrola treści autora) |
| T03-C03 | STOP, eskalacja, uprawnienia i ochrona sekretów | Warunki ujęte w obu kontraktach | Porównanie z FR-06, NFR-04 | `PASS` (kontrola treści autora) |
| T03-C04 | Brak fikcyjnej autoryzacji i uruchomienia | Przykład `BLOCKED`, bez uprawnień zapisu | Inspekcja dokumentu | `PASS` (kontrola treści autora) |
| T03-C05 | Review właściciela | Oczekuje na decyzję | Review właściciela | `NOT RUN` |

## 4. Status końcowy

- **T-03:** `IN PROGRESS`, do review właściciela.
- **AC-04:** kontrola treści autora `PASS`, finalna akceptacja oczekuje.
- **G0:** `BLOCKED` — bez zmiany.
- **T-04, T-05, G6, G7:** `NOT RUN`.
- **Testy aplikacji / CI:** `NOT RUN` (poza zakresem T-03).
- **GitHub:** bez zmian. Dokument istnieje wyłącznie lokalnie.
