# Lekcja 02 — T-05: końcowy lokalny review pakietu SDD v0.2

- **Data review:** 2026-11-13
- **Repozytorium docelowe:** `borys94/tetris-multiplayer`, `main`
- **Zakres:** wyłącznie lokalny pakiet `/mnt/data/lesson-02-sdd-v0.2-editorial.zip` i lokalne dowody T-01–T-04; bez operacji zapisu GitHub.
- **Ocena:** `LOCAL REVIEW: PASS` dla sprawdzonej spójności redakcyjnej i strukturalnej; **T-05: BLOCKED** w zakresie operacyjnym; **G6/AC-06: BLOCKED**.
- **Baseline G0:** `BLOCKED` — niepotwierdzony HEAD `main`. Commit `99c5c39a78c638960cbc5259ccd20dfda3fed868` jest kandydatem, nie potwierdzonym HEAD.

## 1. Przejrzane pliki

| Plik | Wersja | Status w nagłówku | SHA-256 lokalnej treści |
|---|---|---|---|
| `specs/002-ai-workflow/requirements.md` | 0.2 | Approved w rozmowie | `c2e43e81c505` (prefiks) |
| `specs/002-ai-workflow/spec.md` | 0.2 | Approved w rozmowie | `fcb3936e24fa` (prefiks) |
| `specs/002-ai-workflow/design.md` | 0.2 | Approved w rozmowie | `34e3ee4958b5` (prefiks) |
| `specs/002-ai-workflow/tasks.md` | 0.2 | Approved w rozmowie | `1e47ea003f91` (prefiks) |

Hash jest identyfikatorem lokalnych bajtów, nie commitem GitHub.

## 2. Weryfikacja poprawek z pre-review

| Uwaga | Plik | Problem i ryzyko | Weryfikacja | Wynik |
|---|---|---|---|---|
| M-01 | Wszystkie 4 dokumenty | Historyczny status Draft wprowadzał w błąd co do akceptacji | Nagłówki czterech plików mają `Approved` i wyraźne ograniczenie „zapis do GitHub nieautoryzowany” | RESOLVED — lokalnie |
| M-02 | `spec.md`, `design.md` | Nieaktualne odniesienia do niezatwierdzonych wersji | Podstawy wskazują zatwierdzone dokumenty v0.2; historyczne v0.1 pozostaje wyłącznie jako historia review | RESOLVED — lokalnie |
| m-01 | `tasks.md` | `TODO` mogło być mylone z aktualnym stanem | Wyraźna uwaga historyczna przy planie oraz aktualizacja stanu po pre-review | RESOLVED — lokalnie |
| M-03 | G0, T-05, GitHub | Brak potwierdzonego HEAD i dowodu zawartości na commicie uniemożliwia AC-06 | Potrzebny wiarygodny odczyt referencji `main`, osobna zgoda na zapis i odczyt 4 plików na określonym SHA | OPEN — BLOCKED |

## 3. Kontrole strukturalne

- `LOCAL-C01`: cztery wymagane dokumenty obecne w archiwum — `PASS`.
- `LOCAL-C02`: zgodne `ID=002-ai-workflow`, wersja `0.2`, lokalny status `Approved` — `PASS`.
- `LOCAL-C03`: `spec.md` zawiera AC-01–AC-07, a `tasks.md` zawiera przypisania do T-01–T-06 — `PASS` (kontrola obecności i ręczne sprawdzenie mapowania).
- `LOCAL-C04`: w `spec.md` występują wszystkie 19 wariantów scenariuszy; `tasks.md` przypisuje S-01A–E, S-02–04, S-06–07, S-09A–D, S-10A–C do T-04, a S-05/S-08 do T-05 — `PASS`.
- `LOCAL-C05`: oddzielenie G6 (AC-06) od G7 (AC-07), w tym odrębny commit `progress.md` — `PASS`.
- `LOCAL-C06`: treść raportów T-01–T-04 zaakceptowana przez właściciela w rozmowie; nie weryfikowano ich publikacji w GitHub — `PASS` dla akceptacji lokalnej; publikacja `NOT RUN`.
- `LOCAL-C07`: potwierdzony HEAD `main` — `BLOCKED`.
- `LOCAL-C08`: zawartość czterech dokumentów na konkretnym commicie GitHub — `NOT RUN` (brak autoryzacji zapisu).

## 4. Scenariusze S-05 i S-08

- **S-05:** wcześniejsza ręczna symulacja decyzji — `PASS` jako symulacja. Rzeczywiste porównanie z jednoznaczną rewizją HEAD — `BLOCKED` z powodu G0.
- **S-08:** wcześniejsza ręczna symulacja poprawnego przypisania `BLOCKED` — `PASS` jako symulacja. Operacyjna weryfikacja aktualnej rewizji — `BLOCKED`.
- Symulacji nie należy przedstawiać jako potwierdzenia faktycznego działania automatycznych blokad ani jako dowodu publikacji.

## 5. Pozostałe ryzyka i decyzja

**Otwarte `Critical`:** 0 stwierdzonych w zakresie lokalnego review. **Otwarte `Major`:** M-03 (1). Nie oznacza to pełnego review repozytorium ani aplikacji.

**Werdykt:** `LOCAL REVIEW: PASS` dla sprawdzonej redakcji i śledzenia; **`T-05: BLOCKED`, `G6/AC-06: BLOCKED`**. Lekcja 02 pozostaje otwarta. `G7: NOT RUN`.

**Kolejne kroki:** (1) niezależnie potwierdzić aktualny HEAD `main`, (2) ponownie sprawdzić baseline przed zapisem, (3) uzyskać osobną jawną zgodę na zapis SDD i dowodów, (4) wykonać zapis w zatwierdzonym zakresie, (5) odczytać rzeczywistą treść czterech dokumentów na konkretnym SHA i sporządzić raport G6. Nie aktualizować `progress.md` przed G7.

**Niewykonane:** zapis GitHub, testy aplikacji, CI, E2E, automatyczne egzekwowanie reguł. Żadnego z nich nie oznaczono jako `PASS`.
