# Requirements — Lekcja 02: test diagnostyczny i workflow AI

- **ID:** `002-ai-workflow`
- **Wersja:** 0.2
- **Status:** Approved — zatwierdzono przez właściciela w rozmowie L02 (2026-11-13); zapis do GitHub nieautoryzowany
- **Podstawa:** `syllabus.md` (L02), `progress.md` (`main`, odczyt 2026-11-13), zatwierdzony pakiet SDD L01, zatwierdzenie ogólnego workflow w rozmowie L02, review `requirements.md` v0.1 i akceptacja wszystkich siedmiu uwag.
- **Charakter:** organizacja pracy i dokumentacja; bez implementacji aplikacji, CI ani infrastruktury.

## 1. Cel i problem

Ustalić powtarzalny, audytowalny proces współpracy człowieka, ChatGPT, Claude Code i GitHub, który ogranicza ryzyko niezatwierdzonych zmian, błędnych deklaracji o testach i rozbieżności między dokumentacją a kodem. Zdiagnozować wiedzę wejściową uczestnika, bez utożsamiania testu teoretycznego z potwierdzeniem kompetencji praktycznych.

## 2. Role i uprawnienia

| Rola | Odpowiedzialność | Ograniczenie |
|---|---|---|
| Właściciel / Tech Lead | Zakres, akceptacja wymagań, specyfikacji, projektu i zadań, decyzje architektoniczne, zamknięcie lekcji | Nie deleguje ostatecznej akceptacji AI |
| ChatGPT | Mentoring, propozycje SDD, analiza ryzyk, review dowodów | Nie deklaruje wykonania niezweryfikowanych czynności |
| Claude Code | Realizacja zatwierdzonych zadań, uruchomienie dostępnych kontroli, raport wyników | Nie rozszerza zakresu ani nie zatwierdza własnych zmian |
| GitHub | Wersjonowane źródło prawdy: dokumenty, kod, commity, PR, `progress.md` | Lokalna kopia nie zastępuje odczytu właściwej gałęzi i rewizji |

## 3. Wymagania funkcjonalne procesu

| ID | Wymaganie | Priorytet |
|---|---|---|
| FR-01 | Proces dokumentuje diagnozę: datę, zakres tematyczny, liczbę pytań, liczbę poprawnych odpowiedzi, wynik punktowy, interpretację oraz ograniczenia oceny kompetencji praktycznych | Must |
| FR-02 | Przed rozpoczęciem pracy weryfikuje się aktualne `syllabus.md`, `progress.md` i właściwe zatwierdzone specyfikacje w GitHub. Raport identyfikuje repozytorium, gałąź, commit SHA (lub inną jednoznaczną rewizję), datę odczytu i status weryfikacji. Jeżeli nie można potwierdzić właściwej rewizji, kontrola ma status `BLOCKED`; nie wolno przedstawiać lokalnej kopii jako aktualnego stanu GitHub. Rozbieżności lokalnej kopii i GitHub należy ujawnić przed dalszymi decyzjami zależnymi od tych danych | Must |
| FR-03 | Zmiana przechodzi przez `requirements.md` → `spec.md` → `design.md` → `tasks.md`; odstępstwa dla pracy organizacyjnej wymagają jawnego uzasadnienia i zgody właściciela | Must |
| FR-04 | Implementacja lub wykonanie zadań zmieniających repozytorium może rozpocząć się dopiero po zatwierdzeniu przez właściciela `requirements.md`, `spec.md`, `design.md` i zakresu `tasks.md`. Każdy dokument ma jawny status akceptacji. Zmiana zatwierdzonego zakresu wymaga ponownej akceptacji odpowiednich artefaktów | Must |
| FR-05 | Zadanie dla Claude Code ma zakres, wykluczenia, powiązanie z AC, warunki ukończenia i wymagane dowody | Must |
| FR-06 | Rozszerzenie zakresu, nowa istotna zależność lub zmiana architektury wymaga zatrzymania pracy i decyzji właściciela; ADR, gdy właściwy | Must |
| FR-07 | Review porównuje rezultat ze specyfikacją oraz analizuje testy, bezpieczeństwo, wydajność i utrzymywalność w zakresie adekwatnym do zmiany | Must |
| FR-08 | Każda kontrola ma jawny status: `NOT RUN` — nie wykonano; `PASS` — wykonano i istnieją wystarczające dowody spełnienia kryterium; `FAIL` — wykonano i wykryto niespełnienie kryterium; `BLOCKED` — nie można wykonać lub wiarygodnie ocenić kontroli z powodu wskazanej przeszkody. Brak lub niekompletność dowodów wyklucza `PASS`; raport wskazuje przyczynę i brakujące dowody | Must |
| FR-09 | `progress.md` jest aktualizowany dopiero po weryfikacji dowodów, ukończeniu wymaganych zadań, review oraz jawnej decyzji właściciela o zamknięciu lekcji | Must |
| FR-10 | Uwagi review mają poziom `Critical`, `Major`, `Minor` albo `Suggestion` i opisują plik, problem, ryzyko, poprawkę i weryfikację | Must |

## 4. Wymagania niefunkcjonalne

| ID | Wymaganie | Metoda sprawdzenia |
|---|---|---|
| NFR-01 | Śledzenie: każde AC ma zadanie i metodę weryfikacji, każde zadanie wskazuje AC | Macierz AC ↔ T |
| NFR-02 | Odtwarzalność: raport identyfikuje sprawdzane pliki, wersję lub commit oraz wykonane polecenia, jeżeli dotyczy | Review raportu |
| NFR-03 | Uczciwość dowodów: nie wolno dopisywać fikcyjnych wyników, commitów, testów ani akceptacji | Scenariusze negatywne |
| NFR-04 | Minimalizacja uprawnień i danych: prompty nie zawierają sekretów. Operacje zapisu mogą odbywać się tylko w zatwierdzonym zakresie i przy odpowiednich uprawnieniach; operacje destrukcyjne oraz wykraczające poza zatwierdzony zakres wymagają osobnej, jawnej zgody właściciela. Zatwierdzenie dokumentu nie stanowi automatycznej zgody na dowolną operację w repozytorium | Review instrukcji i scenariusze: zapis w zakresie, usunięcie pliku, zapis poza zakresem |
| NFR-05 | Proces ma być stosowalny także do zmian wyłącznie dokumentacyjnych, bez wymuszania nieadekwatnych testów aplikacji | Scenariusz L02 |

## 5. Zakres

**W zakresie:** diagnoza, role, bramki akceptacji, szablon zlecenia, ścieżka dowodowa, scenariusze kontrolne i dokumenty SDD L02.

**Poza zakresem:** monorepo i TypeScript tooling (L03), formalne szablony i ADR (L04), konfiguracja CI (L05), kod gry, backend, infrastruktura, automatyzacja GitHub.

## 6. Fakty, decyzje i organizacja dowodów

### 6.1 Fakty

- Test diagnostyczny przeprowadzono **2026-11-13** w rozmowie L02: **10 pytań, 10 poprawnych odpowiedzi, 20/20 punktów**. Zakres: walidacja runtime w TypeScript, deterministyczność, autorytatywny serwer, testy, kryteria akceptacji, separacja silnika, idempotencja, CI, SDD, kontrola zakresu AI. Interpretacja: poprawna znajomość sprawdzanych zasad. Ograniczenia: pytania zamknięte, odpowiedzi własne uczestnika, brak niezależnej oceny umiejętności praktycznych.
- Właściciel zatwierdził **ogólny workflow** oraz wszystkie cztery dokumenty SDD L02 v0.2 w rozmowie; zatwierdzenie nie stanowi zgody na zapis do GitHub.
- `progress.md` na `main` wskazywał 1/60 i L02 „Nie rozpoczęto” podczas wcześniejszego odczytu. Rozpoczęcie pracy w rozmowie nie jest jeszcze aktualizacją repozytorium. Przed operacjami zależnymi od aktualnego stanu należy ponowić weryfikację zgodnie z FR-02.

### 6.2 Rejestr decyzji procesowych

| ID | Decyzja | Status |
|---|---|---|
| D-02-01 | GitHub jest wersjonowanym źródłem prawdy; lokalna kopia nie zastępuje odczytu repozytorium | Zatwierdzona jako część ogólnego workflow |
| D-02-02 | Człowiek podejmuje ostateczne decyzje i zatwierdza zakres | Zatwierdzona jako część ogólnego workflow |
| D-02-03 | Implementacja wymaga uprzedniego zatwierdzenia SDD i zadań; zmiana zakresu wymaga ponownej akceptacji | Zatwierdzona w rozmowie L02 (v0.2) |
| D-02-04 | Szczegółowe dowody przechowujemy w katalogu lekcji, a w `progress.md` umieszczamy status i odnośniki | Zatwierdzona w rozmowie L02 (v0.2) |

### 6.3 Lokalizacja dowodów

**Zatwierdzona konwencja:** szczegółowy raport diagnostyczny oraz raporty review umieszcza się w `specs/002-ai-workflow/evidence/` po zatwierdzeniu zakresu zadań; `progress.md` zawiera zwięzły stan, identyfikatory dowodów i odnośniki do plików/commitów. Nie tworzymy fikcyjnych plików dowodowych ani nie oznaczamy ich jako istniejące przed zapisem w repozytorium.

### 6.4 Status review i dalsze kroki

- Zatwierdzono w rozmowie treść `requirements.md`, `spec.md`, `design.md` i `tasks.md` v0.2, w tym bramki oraz konwencję dowodów.
- Lokalny pre-review T-05 wykazał potrzebę synchronizacji metadanych; G0 i weryfikacja na GitHub pozostają `BLOCKED`.
