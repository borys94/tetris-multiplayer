# Specification — Lesson 005: CI Quality Gates

**Status:** Draft  
**Requirements:** [requirements.md](./requirements.md)

## 1. Kontrakty

**SPEC-001 — Uruchamianie i zestaw kontroli (REQ-001)**
PR kierowany do `main` (`opened`, `reopened`, `synchronize`, `edited`) uruchamia CI; `edited` obejmuje również zmianę gałęzi bazowej. Kontrole obejmują ESLint dla trzech workspace'ów, markdownlint dla dokumentacji, Yarn constraints, TypeScript, Vitest i build. Każda kontrola ma własny, stabilny status check: `lint-ts`, `lint-markdown`, `constraints`, `typecheck`, `test`, `build`. Nie stosujemy filtrów ścieżek, które mogłyby pozostawić obowiązkowy check bez wyniku. Błąd dowolnej obowiązkowej kontroli powoduje nieudany status odpowiedniego checka. Lokalne `yarn check` uruchamia wszystkie sześć kategorii kontroli (constraints, oba rodzaje lintu, typecheck, testy, build), chociaż CI może wykonywać je w osobnych jobach.

**SPEC-002 — Odtwarzalne środowisko (REQ-002)**
CI używa Node.js zgodnego z `.nvmrc` (26), Yarn 4.18.1 z `packageManager` i `yarn install --immutable`; nie zapisuje zmienionego lockfile.

**SPEC-003 — Pełny graf i cache (REQ-003)**
Pierwsza wersja uruchamia kontrole we wszystkich workspace'ach. Turborepo respektuje `^build` i zależności `@tetris/web`, `@tetris/server` → `@tetris/game-engine`. W pierwszej iteracji nie korzystamy ze zdalnego cache ani z cache Turborepo współdzielonego między uruchomieniami CI. Dopuszczamy lokalny cache w obrębie pojedynczego uruchomienia, z wejściami obejmującymi zależności i konfigurację wpływającą na wynik. Scenariusz negatywny weryfikuje ponowne wykonanie właściwych zadań po zmianie API współdzielonego pakietu, bez wykorzystania nieaktualnego wyniku.

**SPEC-004 — Ograniczone uprawnienia (REQ-004)**
Workflow korzysta z `pull_request`, uprawnień `contents: read`, bez `pull_request_target`, bez zapisu do repozytorium i bez sekretów.

**SPEC-005 — Wynik PR i merge (REQ-005)**
Wyniki sześciu obowiązkowych kontroli są widoczne jako odrębne, stabilnie nazwane status checks: `constraints`, `lint-ts`, `lint-markdown`, `typecheck`, `test`, `build`. Każdy z nich jest wymagany przez GitHub Rulesets/branch protection dla `main`. Niepowodzenie dowolnego z nich uniemożliwia merge. Weryfikacja rzeczywistej blokady merge jest niezależna od samego uruchomienia workflow; brak dostępu do ustawień ochrony nie jest dowodem spełnienia kontraktu.

## 2. Przypadki brzegowe
- Niespójny `yarn.lock` → instalacja kończy się błędem.
- Błąd ESLint, markdownlint, typecheck, Vitest lub build → nieudany status.
- Zmiana publicznego API `game-engine` łamiąca konsumenta → CI wykrywa błąd w zależnym workspace.
- Naruszenia historycznego Markdown → audyt i decyzja właściciela przed masową korektą; nie wyciszać wszystkich reguł dla uzyskania zielonego CI.
- Brak dostępu do konfiguracji ochrony `main` → AC-006 `NOT_RUN`/zadanie `BLOCKED`, bez deklaracji pełnego `PASS`.
- PR z forka → brak potrzeby sekretów lub uprzywilejowanych uprawnień.

## 3. Weryfikacja

| AC | Kryterium | SPEC | Metoda |
|---|---|---|---|
| AC-001 | Otwarcie, ponowne otwarcie, aktualizacja commitów oraz zmiana gałęzi bazowej PR do `main` uruchamiają wszystkie sześć obowiązkowych kontroli | SPEC-001 | Próby zdarzeń PR i przegląd logów/statusów GitHub Actions |
| AC-002 | Celowo wprowadzony błąd lint TypeScript i Markdown daje nieudany status; po cofnięciu błędu kontrola przechodzi | SPEC-001 | Testy negatywne na gałęzi feature |
| AC-003 | Instalacja z niespójnym lockfile nie przechodzi | SPEC-002 | Test negatywny `yarn install --immutable` |
| AC-004 | Po poprawnym przebiegu kontrolowana niezgodna zmiana API `game-engine` jest wykryta przez typecheck zależnej aplikacji; nie jest użyty nieaktualny wynik z cache | SPEC-003 | Dwa przebiegi (przed zmianą i po zmianie) + logi Turborepo |
| AC-005 | Workflow nie wymaga sekretów i ma tylko wymagane uprawnienia odczytu | SPEC-004 | Review YAML i próba PR bez sekretów |
| AC-006 | Każdy z sześciu status checks jest wymagany dla `main`; niepowodzenie dowolnego blokuje merge | SPEC-005 | Odczyt Rulesets/branch protection i rzeczywista próba merge przy nieudanym checku; bez dostępu `NOT_RUN` (nie `PASS`) |
