# Specification — zakres MVP i kryteria akceptacji

- **ID:** 001-mvp-architecture
- **Wersja:** 0.3
- **Status:** Draft — do review
- **Rodzaj:** Specyfikacja zakresu i kontraktów architektonicznych, nie pełna specyfikacja reguł gry

- **Podstawa:** zatwierdzone merytorycznie `requirements.md` v0.2 oraz decyzje D-01–D-05; review `spec.md` v0.2 (2 Major, 4 Minor)
- **Zmiany v0.3:** jawne testy FR-09 i NFR-02, kontrola NFR-06, doprecyzowanie S-16/S-17 oraz macierzy śledzenia

## 1. Granica specyfikacji
Niniejszy dokument definiuje weryfikowalne zobowiązania architektoniczne i produktowe dla etapów M2/M3 oraz kryteria **dokumentacyjne lekcji 01**. Szczegóły implementacyjne i reguły niezatwierdzone w `requirements.md` będą rozwijane w lekcjach 06–30. Zatwierdzone decyzje produktowe D-01–D-05 są wiążące. Scenariusze przyszłe poniżej są kontraktami wysokiego poziomu, nie dowodem ich realizacji.

## 2. Kryteria akceptacji lekcji 01

| ID | Given | When | Then | Dowód |
|---|---|---|---|---|
| AC-01 | Dostępne są `requirements.md` i syllabus | Recenzent porównuje MVP z kamieniami M2/M3/M4 | Zakres i wykluczenia są jawne i nie przenoszą funkcji M4 do M3 | Checklista review |
| AC-02 | Istnieją wymagania FR i NFR | Recenzent sprawdza `spec.md` | Każde kluczowe wymaganie ma scenariusz albo jawne wskazanie lekcji doprecyzowującej | Macierz śledzenia |
| AC-03 | Dostępny jest `design.md` | Recenzent analizuje przepływ wejścia i wyniku | Wskazano serwer jako właściciela autorytatywnego stanu, a silnik jest niezależny od transportu | Review diagramu i granic |
| AC-04 | W `design.md` opisano warianty | Recenzent ocenia kompromisy i ryzyka | Zapisano uzasadnienia decyzji oraz konsekwencje i alternatywy | Review decyzji |
| AC-05 | Dostępny jest `tasks.md` | Recenzent sprawdza zadania | Każde zadanie ma wynik, kontrolę wykonania i odwołanie do AC | Kontrola powiązań |
| AC-06 | Dostępne są wszystkie cztery dokumenty | Recenzent porównuje terminologię, status i zakres | Nie ma sprzecznych założeń ani nieuzasadnionych deklaracji ukończenia testów | Raport review |

## 3. Przyszłe scenariusze akceptacyjne produktu

### S-01: Deterministyczna symulacja (FR-02, NFR-01, NFR-02)
**Given** identyczny stan początkowy, seed, uporządkowane wejścia i ticki, **when** dwa uruchomienia symulacji wykonują te same kroki, **then** końcowe stany są identyczne. Szczegółowe testy: lekcje 06–15.

### S-02: Dołączenie do meczu 1v1 (FR-03, FR-04; D-01, D-02)
**Given** gość utworzył prywatny pokój i otrzymał kod oraz link zawierający ten sam identyfikator zaproszenia, **when** drugi gość dołącza przez kod albo odpowiadający mu link, **then** obie drogi wskazują ten sam pokój, stosują te same reguły walidacji i pozwalają obsadzić drugie miejsce; próba dołączenia trzeciego aktywnego uczestnika jest odrzucona bez zmiany składu. Szczegóły: lekcja 28.

### S-03: Autorytatywność (FR-06, NFR-03)
**Given** trwa mecz, **when** klient przesyła wejście, **then** serwer waliduje je i wylicza rezultat; deklaracja klienta o punktach lub zwycięstwie nie jest traktowana jako źródło prawdy. Szczegóły: lekcje 26–29.

### S-04: Powtórzone wejście (FR-09)
**Given** serwer przetworzył wejście o określonym identyfikatorze w danej sesji, **when** otrzyma duplikat, **then** nie zastosuje skutku wejścia ponownie. Szczegóły: lekcja 27.

### S-05: Reconciliation (FR-07, FR-08)
**Given** klient ma niepotwierdzone wejścia, **when** otrzymuje nowszy autorytatywny snapshot, **then** przyjmuje jego stan bazowy i odtwarza wyłącznie właściwe niepotwierdzone wejścia we właściwym kontekście ticków. Szczegóły: lekcja 30.

### S-06: Snapshot poza kolejnością (FR-08, FR-09)
**Given** klient zastosował snapshot tick 108 w określonej sesji/epoce, **when** otrzymuje snapshot tick 105 z tej samej epoki, **then** nie cofa do niego stanu. Szczegóły: lekcja 30.

### S-07: Reconnect bez pauzowania (FR-08; D-04)
**Given** trwa mecz 1v1, a serwer wykrywa rozłączenie A w chwili `t0` według zegara serwera, **when** A pozostaje rozłączony, **then** symulacja obu plansz i poprawne wejścia B są nadal przetwarzane, bez generowania zastępczych wejść A.

**Given** mecz nadal trwa, **when** A odzyskuje i potwierdza własność swojej sesji przed upływem 30 sekund od `t0`, **then** otrzymuje aktualny autorytatywny snapshot i może kontynuować grę.

**Given** mecz nadal trwa, **when** upływa 30 sekund od `t0` bez poprawnego odzyskania sesji A, **then** A przegrywa z powodu `DISCONNECT_TIMEOUT`. **Given** przed terminem wystąpiło prawidłowe zakończenie meczu (np. `TOP_OUT`), **then** wynik wcześniejszego zdarzenia pozostaje ostateczny i reconnect nie wznawia meczu. Szczegóły zegara, wykrywania rozłączenia i przypadków granicznych: lekcja 30.

### S-08: Błędny komunikat (FR-09, NFR-04)
**Given** klient wysyła niezgodny z kontraktem payload, **when** serwer go odbiera, **then** odrzuca komunikat bez naruszenia stanu meczu. Szczegóły: lekcje 26–27.

### S-09: Lokalny development (NFR-05)
**Given** deweloper dysponuje udokumentowanymi narzędziami i konfiguracją lokalną poza repozytorium, **when** uruchamia lokalny zestaw usług i testy integracyjne, **then** nie musi korzystać z AWS ani dodawać sekretów do repozytorium. Kontrola braku sekretów zapisanych w kodzie jest osobnym scenariuszem S-20. Szczegóły: lekcje 03, 21–25.

### S-10: Dostęp gościnny (FR-03, FR-04; D-02)
**Given** dwaj niezalogowani użytkownicy, **when** pierwszy tworzy pokój, a drugi dołącza poprawnym zaproszeniem, **then** obaj mogą zająć swoje miejsca i rozpocząć mecz bez zakładania konta. Brak profilu nie blokuje uczestnictwa. Szczegóły: lekcja 28.

### S-11: Knockout jednostronny (FR-05; D-03)
**Given** trwa mecz, **when** wyłącznie gracz A osiąga `top-out`, **then** serwer kończy mecz zwycięstwem B z powodem `TOP_OUT`; analogicznie dla `top-out` wyłącznie B. Wynik nie zależy od deklaracji klienta. Szczegóły definicji `top-out`: lekcje silnika i 29.

### S-12: Jednoczesny top-out (FR-05; D-03)
**Given** obie plansze są symulowane w ramach tego samego ticka meczu, **when** A i B osiągają `top-out` w tym ticku, **then** serwer kończy mecz remisem, niezależnie od kolejności dostarczenia pakietów wejściowych przy tym samym uporządkowanym zestawie wejść. Szczegóły: lekcja 29.

### S-13: Rezygnacja i niezmienność wyniku (FR-05, FR-09, NFR-03; D-03)
**Given** trwa mecz, **when** A świadomie rezygnuje przez autoryzowaną akcję `FORFEIT`, **then** B wygrywa z powodem `FORFEIT`. **Given** mecz jest zakończony, **when** przychodzi spóźnione wejście lub fałszywa deklaracja zwycięstwa, **then** stan końcowy i wynik nie zmieniają się. Utrata połączenia sama w sobie nie jest `FORFEIT`.

### S-14: Ochrona sesji po reconnect (FR-08, FR-09, NFR-04; D-01, D-02, D-04)
**Given** A zajmuje miejsce w pokoju, **when** osoba trzecia zna wyłącznie kod zaproszenia, **then** nie może przejąć sesji A. **Given** A prawidłowo odzyskał sesję na nowym połączeniu, **when** stare połączenie wysyła wejście, **then** serwer nie stosuje tego wejścia. Szczegóły tożsamości i tokenów: lekcje 27–30.

### S-15: Sterowanie klawiaturą desktopową (FR-01, FR-02; D-05)
**Given** gra działa w przeglądarce desktopowej objętej później zatwierdzoną macierzą wsparcia, **when** gracz naciska przypisany klawisz, **then** adapter wejścia generuje właściwą komendę domenową, a silnik wykonuje dozwolony ruch. **When** naciśnięty klawisz nie jest przypisany, **then** adapter nie generuje komendy gry. **Given** identyczne komendy, stan i ticki, **then** wynik silnika nie zależy od fizycznego źródła wejścia. Wsparcie dotyku i gamepada nie jest kryterium M2/M3. Mapowanie klawiszy i lista przeglądarek: lekcje frontendowe.

### S-16: Wynik i aktualizacje dla obu graczy (FR-07)
**Given** trwa mecz i obaj uprawnieni uczestnicy mają aktywne połączenia, **when** serwer publikuje autorytatywną aktualizację, **then** kieruje aktualizację do obu właściwych połączeń. **Given** jeden uczestnik jest rozłączony, **when** serwer publikuje aktualizacje, **then** symulacja trwa bez wymogu doręczenia każdej pośredniej aktualizacji do nieaktywnego połączenia. **When** serwer kończy mecz, **then** wynik końcowy jest jednolity i możliwy do uzyskania przez obu uprawnionych uczestników, także po prawidłowym odzyskaniu sesji, jeśli mecz zakończył się podczas rozłączenia. Nie wymaga to gwarantowanej retransmisji wszystkich historycznych snapshotów. Szczegóły protokołu dostarczania: lekcje 26–30.

### S-17: Granica danych trwałych i profili (FR-10) — Deferred specification
**Given** rozwijane jest API profili i trwałych danych, **when** projektowane są endpointy i model danych, **then** specyfikacje lekcji 21–24 muszą zdefiniować operacje, schematy danych, autoryzację i przypadki błędów, przy zachowaniu dostępu gościnnego do M3 bez obowiązkowego profilu. **Status:** zobowiązanie do późniejszej specyfikacji, **nie** test akceptacyjny działającego API i **nie** pełne pokrycie FR-10. Nie oznacza zatwierdzenia konkretnych endpointów.

### S-18: Nieaktualne i nieautoryzowane wejście (FR-09, NFR-04)
**Given** serwer ma autorytatywny stan meczu i określony kontekst ważności wejść, **when** otrzymuje wejście poprawne składniowo, ale uznane za nieaktualne według zatwierdzonej polityki ticków/sekwencji, **then** odrzuca je bez zmiany autorytatywnego stanu i bez ponownego wykonania akcji.

**Given** uczestnik A ma autoryzowaną sesję przypisaną do swojego miejsca, **when** połączenie bez uprawnień do tego miejsca (w tym obca sesja) przesyła poprawnie sformatowane wejście w imieniu A, **then** serwer odrzuca je bez zmiany stanu. Ten przypadek nie wymaga wcześniejszego reconnect i jest niezależny od S-14. **Otwarte:** dokładne okno aktualności, polityka sekwencji i kody błędów — do zatwierdzenia w lekcji 27. Testy powinny obejmować oddzielnie nieaktualność i brak autoryzacji.

### S-19: Niezależność architektoniczna silnika (NFR-02)
**Given** pakiet `packages/game-engine` i jego graf zależności, **when** wykonywana jest statyczna kontrola importów oraz zależności bezpośrednich i pośrednich wykorzystywanych przez kod silnika, **then** pakiet nie wymaga Reacta, DOM, Canvas, WebSocket ani sterowników bazy danych do kompilacji i wykonania symulacji. **When** uruchamiane są testy jednostkowe silnika w środowisku bez przeglądarki i serwera HTTP/WebSocket, **then** nie wymagają uruchomienia tych komponentów. Weryfikacja: kontrola zależności i testy jednostkowe, lekcje 03 i 06–15.

### S-20: Konfiguracja i sekrety (NFR-06)
**Given** kod, konfiguracja i pliki śledzone w repozytorium, **when** recenzent wykonuje kontrolę konfiguracji i skanowanie sekretów, **then** nie stwierdza świadomie zapisanych na stałe prawdziwych sekretów ani wartości środowiskowych, które powinny być dostarczane z zewnątrz; lokalne uruchomienie korzysta z udokumentowanego mechanizmu konfiguracji poza śledzonym kodem. **When** wykryta zostaje podejrzana wartość, **then** wymaga oceny przed akceptacją zmiany. Skanowanie zmniejsza ryzyko, ale nie gwarantuje wykrycia każdego sekretu. Weryfikacja: review i kontrola CI, lekcje 03, 05 i 21–25.

## 4. Przypadki brzegowe i otwarte kontrakty
| Przypadek | Oczekiwana własność | Doprecyzowanie |
|---|---|---|
| Kod i link wskazują ten sam pokój | Wspólny identyfikator i walidacja | L28; format i ważność zaproszenia otwarte |
| Trzeci gracz próbuje dołączyć | Brak zmiany składu pokoju | L28 |
| Duplikat wejścia | Brak podwójnego efektu | S-04; L27 |
| Wejście nieaktualne względem zatwierdzonej polityki | Odrzucenie bez zmiany stanu | S-18; reguła aktualności do decyzji w L27 |
| Wejście obcej sesji bez prawa do miejsca | Odrzucenie bez zmiany stanu, również bez reconnect | S-18; L27 |
| Niepoprawny payload | Brak zmiany stanu | L26–27 |
| Starszy snapshot w tej samej epoce | Brak cofnięcia zaakceptowanego stanu | L30 |
| Nowa epoka i tick 0 | Snapshoty różnych epok nie są mylone | L30 |
| Rozłączenie A | Gra trwa; termin 30 s według czasu serwera | L30 |
| `top-out` A podczas rozłączenia | `TOP_OUT` przed timeoutem, jeśli wystąpi wcześniej | L29–30 |
| Obaj rozłączeni / wielokrotne reconnecty | Brak zatwierdzonej polityki; wymaga decyzji | L30 |
| Reconnect dokładnie na granicy 30 s | Kolejność zdarzeń niezatwierdzona; wymaga testowalnej reguły | L30 |
| Jednoczesny `top-out` | Remis w tym samym ticku | L29 |
| `FORFEIT` i późne wejście | Jeden niezmienny wynik końcowy | L29 |
| Kod pokoju użyty do przejęcia sesji | Odrzucenie próby | L27–30 |
| Awaria procesu meczu | Jawny tryb degradacji; brak automatycznego zwycięstwa | L30, L55 |
| Klawiatura, focus, wersje przeglądarek | Wsparcie desktop + klawiatura; szczegóły otwarte | L16–20 |
| Silnik importuje moduł UI, sieci lub bazy | Naruszenie granicy zależności wykrywane statycznie | S-19; L03, L06–15 |
| Sekret lub konfiguracja środowiskowa wpisana w kod | Wymagana kontrola i poprawka przed akceptacją | S-20; L03, L05, L21–25 |
| Gracz rozłączony podczas emisji snapshotów | Brak wymogu kolejkowania wszystkich pośrednich aktualizacji; wynik końcowy odzyskiwalny | S-16; L26–30 |
| Klient zgłasza własny wynik | Nie jest akceptowany bez weryfikacji | L27–29 |

## 5. Macierz śledzenia
| Wymaganie / decyzja | Scenariusze | Planowane lekcje |
|---|---|---|
| FR-01 | S-15 | 16–20 |
| FR-02 | S-01, S-15 | 06–20 |
| NFR-01 | S-01, S-15 | 06–15 |
| NFR-02 | S-19 (kontrola granic), S-01 (deterministyczność) | 03, 06–15 |
| FR-03, D-01, D-02 | S-02, S-10, S-14 | 28 |
| FR-04 | S-02, S-10 | 28 |
| FR-05, D-03 | S-11, S-12, S-13; S-07 (priorytet wcześniejszego wyniku) | 29–30 |
| FR-06, NFR-03 | S-03, S-11, S-13 | 27–29 |
| FR-07 | S-03, S-16 | 26–30 |
| FR-08, D-04 | S-05, S-06, S-07, S-14, S-16 | 30 |
| FR-09 | S-04, S-06, S-08, S-13, S-14, S-18 | 26–30 |
| NFR-04 | S-08, S-14, S-18; S-02 (limit uczestników) | 26–30 |
| FR-10 | S-17 (**Deferred specification**; brak pełnego pokrycia endpointów) | 21–24 |
| D-05 | S-15 | 16–20 |
| NFR-05 | S-09 | 03, 21–25 |
| NFR-06 | S-20 (kontrola konfiguracji i sekretów), S-09 (lokalne uruchomienie) | 03, 05, 21–25 |
| NFR-07 | AC-01–AC-06; niniejsza macierz | 01 |

### Mapowanie kandydatów AC z `requirements.md` v0.2
| Kandydat | Scenariusz |
|---|---|
| AC-INV-01, AC-INV-02 | S-02 |
| AC-GUEST-01 | S-10 |
| AC-MATCH-01 | S-11 |
| AC-MATCH-02 | S-12 |
| AC-MATCH-03, AC-MATCH-04 | S-13 |
| AC-REC-01, AC-REC-02, AC-REC-03, AC-REC-04 | S-07 |
| AC-REC-05 | S-14 |
| AC-INPUT-01, AC-INPUT-02 | S-15 |

## 6. Weryfikacja i status
- `AC-01`–`AC-06` pozostają kryteriami dokumentacyjnymi **lekcji 01**, nie dowodem wdrożenia gry.
- `S-01`–`S-20` opisują **przyszłe scenariusze produktu i kontrole architektoniczne**. Zachowano identyfikatory `S-01`–`S-17`; dodano S-18 (FR-09), S-19 (NFR-02) i S-20 (NFR-06). S-17 jest jawnie odroczonym zobowiązaniem specyfikacyjnym, nie testem endpointów.
- **Otwarte:** format i ważność zaproszeń, polityka aktualności wejść, obsługa wielu rozłączeń, równoczesne rozłączenie obu graczy, graniczny timeout, mapowanie klawiszy i wersje przeglądarek, szczegółowa definicja `top-out`, ataki/punktacja i API FR-10. S-17 pozostaje oznaczony jako `Deferred specification`.
- **Nie uruchomiono testów aplikacji, CI ani E2E.** Dokument wymaga review właściciela projektu oraz kontroli spójności z `design.md` i `tasks.md`.

### Rejestr odroczeń i status źródeł
- **FR-10 / S-17:** przed implementacją API w lekcjach 21–24 wymagane są osobne testowalne kontrakty endpointów, modeli i błędów.
- **FR-09 / S-18:** przed implementacją walidacji w lekcji 27 należy zatwierdzić reguły aktualności wejść.
- **FR-08 / S-07:** przed implementacją reconnect w lekcji 30 należy rozstrzygnąć wiele rozłączeń, rozłączenie obu graczy i zdarzenia na granicy timeoutu.
- **D-05 / S-15:** przed testami przeglądarkowymi w lekcjach 16–20 należy zatwierdzić macierz przeglądarek i mapowanie klawiszy.
- **Status `requirements.md` v0.2:** właściciel projektu zatwierdził treść w rozmowie; nagłówek pliku źródłowego nadal zawiera `Draft — do review`. Aktualizacja jego metadanych wymaga osobnej zmiany dokumentu, nie jest częścią niniejszej rewizji.
