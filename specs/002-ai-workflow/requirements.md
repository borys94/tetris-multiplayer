# Lekcja 02 — Wymagania: organizacja pracy z AI

**Status:** Approved — zatwierdzono merytorycznie przez właściciela  
**Zakres:** proces współpracy człowiek–ChatGPT–Claude Code, bez implementacji funkcji gry.

## Cel
Ustanowić powtarzalny, audytowalny proces Spec-Driven Development (SDD), w którym człowiek odpowiada za decyzje i akceptację, ChatGPT wspiera analizę i review, a Claude Code realizuje zatwierdzone zadania.

## Wymagania

| ID | Wymaganie | Kryterium akceptacji |
|---|---|---|
| R-01 | Role i odpowiedzialności są jawne. | Dokumentacja wskazuje właściciela decyzji, rolę ChatGPT jako mentora/reviewera i Claude Code jako agenta implementacyjnego. |
| R-02 | Implementacja jest zgodna z zatwierdzonym zakresem SDD. | Zadania wskazują wymagania i kryteria akceptacji; zmiany poza zakresem wymagają propozycji i zgody, a drobne poprawki w zakresie mogą być wykonane i zaraportowane. |
| R-03 | Wyniki pracy są weryfikowane na podstawie dowodów i niezależnego review. | Raport rozróżnia `PASS`, `FAIL`, `NOT_RUN`, podaje wykonane kontrole i ograniczenia; review sprawdza zgodność z SDD, bezpieczeństwo i przypadki brzegowe. |
| R-04 | Operacje wysokiego ryzyka pozostają pod kontrolą człowieka. | Bez jawnej zgody nie wykonuje się merge, deploymentu produkcyjnego, operacji destrukcyjnych ani zmian sekretów. |
| R-05 | Przebieg i zakończenie pracy są odtwarzalne i udokumentowane. | Stosuje się preferowany workflow feature branch/PR, scenariusze S-01–S-05 można przećwiczyć bez kodu aplikacji, a `progress.md` aktualizuje się dopiero na podstawie zweryfikowanych dowodów. |

## Poza zakresem
- Implementacja silnika Tetris, infrastruktury, API i CI.
- Automatyczne zatwierdzanie PR, merge lub deployment.
- Przyznawanie agentom uprawnień do sekretów i środowisk produkcyjnych.

## Kryterium zakończenia lekcji
Wymagania R-01–R-05 są zweryfikowane dokumentacyjnie lub przez symulację, właściciel zatwierdza proces, a `progress.md` jest aktualizowany na podstawie faktycznych dowodów.
