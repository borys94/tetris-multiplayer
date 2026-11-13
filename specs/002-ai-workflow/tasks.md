# Lekcja 02 — Plan zadań

**Status:** Approved — zatwierdzono merytorycznie przez właściciela

| ID | Zadanie | Dowód ukończenia | Status |
|---|---|---|---|
| T-01 | Zatwierdzić wymagania R-01–R-05 i granice autonomii agenta. | Decyzja właściciela; uwagi naniesione w SDD. | DONE |
| T-02 | Dodać cztery dokumenty SDD w `specs/002-ai-workflow/`. | Diff gałęzi `feature/002-ai-workflow`; spójne identyfikatory. | DONE |
| T-03 | Zaproponować dopisanie polityki scope change do `AGENTS.md` po sprawdzeniu istniejących zasad. | Minimalny diff bez nadpisania wcześniejszych reguł. | DONE |
| T-04 | Przećwiczyć scenariusze S-01–S-05 (symulacja/review). | Tabela wyników z PASS/FAIL i uzasadnieniem. | DONE |
| T-05 | Sprawdzić spójność SDD i przygotować PR. | Review checklist, lista zmian, PR lub udokumentowany brak PR. | DONE |
| T-06 | Po akceptacji zaktualizować `progress.md`. | Faktyczne dowody weryfikacji, status lekcji i odnośnik do PR/commita. | DONE |

## Powiązanie wymagań z weryfikacją

| Wymaganie | Sposób weryfikacji |
|---|---|
| R-01 | Review podziału ról w `spec.md` i `design.md`. |
| R-02 | Symulacje S-01 i S-02; review powiązania zadań z SDD. |
| R-03 | Symulacje S-03 i S-04; review raportu weryfikacji. |
| R-04 | Symulacja S-05; review granic autonomii agenta. |
| R-05 | T-02, T-04, T-05, T-06; przegląd dowodów i historii zmian. |

## Checklist review

- [ ] Wszystkie wymagania mają scenariusz lub inną metodę weryfikacji.
- [ ] Agent nie ma prawa samodzielnie rozszerzać zakresu.
- [ ] Drobne poprawki w zatwierdzonym zakresie są jawnie dozwolone.
- [ ] Operacje wysokiego ryzyka wymagają wyraźnej zgody.
- [ ] Raport rozróżnia `PASS`, `FAIL` i `NOT_RUN`.
- [ ] Zmiany nie przeczą `AGENTS.md` ani specyfikacji lekcji 01.
- [ ] `progress.md` nie jest aktualizowany przed weryfikacją.

## Prompt dla Claude Code — po zatwierdzeniu SDD

> Pracujesz w repozytorium `borys94/tetris-multiplayer`. Przeczytaj aktualne `AGENTS.md`, `progress.md` i `specs/002-ai-workflow/{requirements,spec,design,tasks}.md`. Nie zakładaj, że pliki zostały już dodane do repozytorium. Pracuj na gałęzi `feature/002-ai-workflow`. Wykonaj wyłącznie zatwierdzone zadania T-02–T-05. Nie wykonuj merge ani deploymentu. Jeżeli zmiana wykracza poza zatwierdzony zakres, przedstaw propozycję i poczekaj na decyzję. Sprawdź spójność dokumentacji, przeprowadź symulacje S-01–S-05 i raportuj dowody oraz ograniczenia. Nie aktualizuj `progress.md` ani nie oznaczaj lekcji jako ukończonej bez zgody właściciela.
