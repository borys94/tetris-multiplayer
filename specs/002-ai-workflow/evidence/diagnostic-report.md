# T-01 — Raport diagnostyczny — Lekcja 02

- **Data diagnozy:** 2026-11-13 (data sesji; brak niezależnego znacznika czasu odpowiedzi)
- **Źródło:** odpowiedzi użytkownika na 10 pytań w rozmowie L02; raport lokalny, nieopublikowany w GitHub.
- **Zakres:** TypeScript i walidacja runtime; deterministyczność; autorytatywny serwer; testy jednostkowe/integracyjne; kryteria akceptacji; separacja silnika; idempotencja; reakcja na nieudane CI; rozróżnienie `spec.md`/`design.md`; kontrola zmian zakresu AI.
- **Liczba pytań:** 10 (jednokrotny wybór).
- **Liczba poprawnych odpowiedzi:** 10/10.
- **Punktacja:** 20/20 (2 punkty za odpowiedź).
- **Interpretacja:** bardzo dobre rozpoznawanie podstawowych zasad inżynierskich w zakresie testu. Można zwiększyć nacisk kursu na kompromisy architektoniczne, projektowanie i analizę dowodów.
- **Ograniczenia:** krótki test zamknięty sprawdza rozpoznawanie pojęć, nie dowodzi praktycznej biegłości, umiejętności debugowania, jakości kodu ani poziomu Senior/Staff; brak niezależnej kontroli warunków rozwiązywania.

## Sprawdzenie odpowiedzi

| # | Temat | Wynik |
|---|---|---|
| 1 | TypeScript nie waliduje JSON w runtime | Poprawna |
| 2 | Determinizm przy tym samym stanie, losowości i wejściach | Poprawna |
| 3 | Serwer jako źródło prawdy meczu | Poprawna |
| 4 | Jednostkowe vs integracyjne | Poprawna |
| 5 | Obserwowalne kryterium dla pełnego pokoju | Poprawna |
| 6 | Izolacja `packages/game-engine` | Poprawna |
| 7 | Idempotencja | Poprawna |
| 8 | Diagnoza i naprawa nieudanego CI | Poprawna |
| 9 | Specyfikacja zachowania vs projekt realizacji | Poprawna |
| 10 | Zatrzymanie nieautoryzowanego rozszerzenia zakresu | Poprawna |

## Weryfikacja i status

- **AC:** AC-01; **zadanie:** T-01.
- **Metoda:** porównanie raportu z przekazanymi w rozmowie odpowiedziami i zatwierdzonymi wymaganiami FR-01 / AC-01.
- **Wynik kontroli autora:** `PASS` dla kompletności i zgodności treści raportu z rozmową.
- **Status zadania:** `IN PROGRESS` — raport sporządzony lokalnie, oczekuje na review właściciela i późniejszy zapis w repozytorium.
- **Testy aplikacji / CI:** `NOT RUN` (poza zakresem T-01).
- **Reviewer:** oczekuje na review właściciela.
