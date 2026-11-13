# Lekcja 02 — Specyfikacja zachowania workflow AI

**Status:** Approved — zatwierdzono merytorycznie przez właściciela

## Uczestnicy
- **Właściciel projektu (człowiek):** zatwierdza zakres, decyzje architektoniczne, PR, merge i deployment.
- **ChatGPT (mentor/architekt/reviewer):** pomaga opracować wymagania, projekt, zadania i niezależnie ocenia dowody; nie deklaruje uruchomienia testów bez weryfikacji.
- **Claude Code (agent implementacyjny):** odczytuje stan repozytorium, wykonuje zatwierdzone zadania, uruchamia dostępne kontrole i raportuje rezultaty.

## Stany pracy
`DRAFT → REVIEW → APPROVED → IMPLEMENTING → VERIFYING → READY_FOR_REVIEW → CLOSED`

Dopuszczalne przejścia zwrotne:
- `REVIEW → DRAFT`: uwagi do specyfikacji.
- `IMPLEMENTING → REVIEW`: wykryta potrzeba zmiany zakresu.
- `VERIFYING → IMPLEMENTING`: poprawka w zatwierdzonym zakresie.
- `READY_FOR_REVIEW → IMPLEMENTING`: uwagi z code review.
- `VERIFYING → BLOCKED`: nie można przeprowadzić wymaganej weryfikacji.

Przejście do `CLOSED` wymaga potwierdzenia właściciela i dowodów akceptacji.

## Reguły normatywne
1. Agent **MUST** przed pracą przeczytać aktualne `AGENTS.md`, odpowiednią specyfikację i zmieniane pliki.
2. Agent **MUST** wykonywać tylko zadania wynikające z zatwierdzonych wymagań.
3. Agent **MAY** samodzielnie naprawiać błędy i uzupełniać testy w zatwierdzonym zakresie, jeżeli nie zmienia publicznych kontraktów, wymagań ani decyzji architektonicznych.
4. Agent **MUST** zatrzymać zmianę wykraczającą poza zakres i przedstawić propozycję: problem, warianty, kompromisy, ryzyka, wpływ na pliki i testy.
5. Po zatwierdzeniu zmiany zakresu dokumenty SDD **MUST** zostać zaktualizowane przed implementacją.
6. Agent **MUST NOT** przedstawiać nieuruchomionych testów jako zaliczonych.
7. Agent **MUST NOT** wykonywać merge, deploymentu produkcyjnego, operacji destrukcyjnych ani modyfikacji sekretów bez jawnej zgody.
8. Każde zadanie **SHOULD** kończyć się raportem zmian, dowodów weryfikacji, ograniczeń i ryzyk.

## Scenariusze akceptacyjne

### S-01 — Propozycja architektoniczna poza zakresem
**Given:** zatwierdzono implementację prostego modułu.  
**When:** agent proponuje nową warstwę abstrakcji zmieniającą projekt.  
**Then:** agent opisuje propozycję i czeka na akceptację; nie implementuje jej automatycznie.

### S-02 — Drobna poprawka w zakresie
**Given:** test wykrywa błąd w realizacji zatwierdzonego wymagania.  
**When:** poprawka nie zmienia kontraktów ani zakresu.  
**Then:** agent może naprawić błąd, uruchomić adekwatne kontrole i opisać zmianę.

### S-03 — Zielone testy, brak pokrycia wymagania
**Given:** kryterium akceptacji nie ma odpowiadającego testu.  
**When:** istniejące testy przechodzą.  
**Then:** zadanie nie może zostać uznane za zweryfikowane bez uzupełnienia dowodów lub jawnego odnotowania luki.

### S-04 — Nie można uruchomić testów
**Given:** środowisko nie pozwala uruchomić testów.  
**When:** agent kończy pracę.  
**Then:** raport zawiera status `NOT_RUN` i przyczynę, bez deklarowania `PASS`.

### S-05 — Próba merge bez zgody
**Given:** PR jest gotowy.  
**When:** nie ma zgody właściciela na merge.  
**Then:** agent pozostawia PR bez scalania.
