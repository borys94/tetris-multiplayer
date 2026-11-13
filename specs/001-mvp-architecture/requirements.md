# Requirements — Multiplayer Tetris: MVP i architektura

- **ID:** 001-mvp-architecture
- **Wersja:** 0.2
- **Status:** Approved — zatwierdzono merytorycznie przez właściciela
- **Lekcja:** 01 — Analiza wymagań, MVP i architektura docelowa
- **Źródła:** `syllabus.md`, `progress.md`, `requirements.md` v0.1, decyzje D-01–D-05 zatwierdzone w rozmowie
- **Charakter:** zatwierdzona rewizja wymagań; zatwierdzenie `spec.md` jest odrębną decyzją i nie oznacza implementacji

## 1. Cel i problem

Celem produktu jest umożliwienie dwóm graczom rozegrania przez przeglądarkę uczciwego, responsywnego pojedynku w grze o mechanice Tetrisa. Projekt jest równocześnie laboratorium inżynierskim SDD: każdy przyrost ma testowalne wymagania, projekt, zadania i dowody weryfikacji.

## 2. Użytkownicy i potrzeby

| Persona | Potrzeba | Priorytet |
|---|---|---|
| Gracz solo | Poznać sterowanie i rozegrać pełną partię | Must (fundament przed M3) |
| Gracz 1v1 (gość) | Utworzyć pokój i zaprosić drugą osobę bez obowiązkowego konta | Must (M3) |
| Zaproszony gracz (gość) | Dołączyć kodem lub linkiem, rozegrać partię i odzyskać własną sesję po rozłączeniu | Must (M3) |
| Operator/deweloper | Rozpoznać błędy i odtworzyć warunki testu | Must (w zakresie testów i logowania) |

## 3. Zakres i granice wydań

### M2 — fundament single-player (do lekcji 25)

- Grywalna aplikacja w przeglądarkach desktopowych, ze sterowaniem klawiaturą, renderowaniem Canvas i testami E2E.
- Reguły gry w niezależnym, deterministycznym pakiecie.

### M3 — MVP multiplayer (do lekcji 30)

- Pojedynek 1v1 przez WebSocket z autorytatywnym serwerem.
- Prywatne pokoje dwuosobowe, zaproszenia kodem i linkiem korzystające z jednego mechanizmu, dostęp gościnny, rozpoczęcie meczu, przesyłanie wejść i rozstrzyganie wyniku knockout.
- Reconnect w ciągu 30 sekund od wykrycia rozłączenia przez serwer, bez pauzowania symulacji, snapshoty i uzgadnianie stanu.
- Podstawowe zabezpieczenia walidacyjne i obsługa błędnych komunikatów.

### Poza MVP M3

- Ranking, rankingowy matchmaking, replay dostępny graczom i tryb obserwatora (M4).
- Produkcyjne AWS, rozproszone skalowanie i pełne operacyjne SLO (M5–M6).
- Rozbudowany system społecznościowy, turnieje, aplikacje natywne, zakupy w grze (poza planem 60 lekcji).
- Sterowanie dotykowe, pełna obsługa mobile i gamepad nie są wymaganiami M2/M3. Wewnętrzne testowe odtwarzanie sekwencji wejść nie jest funkcją replay dla gracza.

## 4. Wymagania funkcjonalne

| ID | Wymaganie | Priorytet | Planowany etap |
|---|---|---|---|
| FR-01 | Użytkownik w obsługiwanej przeglądarce desktopowej może rozpocząć i zakończyć partię single-player przy użyciu klawiatury | Must | M2 |
| FR-02 | Niezależny silnik obsługuje reguły figur, ruchu, kolizji, grawitacji, blokowania i końca gry określone w specyfikacjach silnika (lekcje 06–15); mapowanie klawiszy nie jest częścią silnika | Must | M2 |
| FR-03 | Gość bez logowania może utworzyć prywatny pokój 1v1 i otrzymać kod zaproszenia; link zawiera ten sam identyfikator zaproszenia, a kod i link korzystają z identycznej walidacji dołączenia | Must | M3 |
| FR-04 | Drugi gość może dołączyć kodem lub linkiem; pokój ma najwyżej dwóch aktywnych uczestników, a odrzucona próba trzeciego nie zmienia składu pokoju | Must | M3 |
| FR-05 | Serwer rozstrzyga mecz knockout: top-out jednego gracza oznacza zwycięstwo drugiego; top-out obu w tym samym ticku oznacza remis; świadoma rezygnacja oznacza przegraną rezygnującego; rozłączenie samo w sobie nie jest rezygnacją | Must | M3 |
| FR-06 | Klient wysyła intencje sterowania; serwer weryfikuje je i oblicza autorytatywny stan | Must | M3 |
| FR-07 | Obaj gracze otrzymują aktualizacje stanu meczu i informację o wyniku | Must | M3 |
| FR-08 | Po wykryciu rozłączenia serwer kontynuuje symulację obu plansz bez zastępczych wejść; gracz ma 30 s czasu serwera na odzyskanie swojej sesji, po czym (jeżeli mecz trwa) przegrywa przez DISCONNECT_TIMEOUT; poprawny reconnect wymaga weryfikacji sesji i dostarczenia aktualnego stanu; wcześniejsze prawidłowe zakończenie meczu ma pierwszeństwo | Must | M3 |
| FR-09 | Serwer odrzuca nieprawidłowe, powtórzone, nieaktualne i nieautoryzowane wejścia bez zmiany stanu meczu; kod pokoju nie uprawnia do przejęcia sesji, a stare połączenie traci prawo sterowania po skutecznym reconnect | Must | M3 |
| FR-10 | System udostępnia podstawowe API profili i trwałych danych, zgodnie z lekcjami backendowymi | Must | M2/M3 |

**Uwaga:** Zatwierdzono zasady zwycięstwa i 30-sekundowe okno reconnect (D-03, D-04). Szczegóły ataków, cyklu startu meczu, polityki ponownych rozłączeń, tożsamości sesji i kontraktów API pozostają do specyfikacji odpowiednich lekcji. FR-10 pozostaje wymaganiem wysokopoziomowym: dostęp gościnny do M3 nie zależy od posiadania profilu.

## 5. Wymagania niefunkcjonalne

| ID | Wymaganie | Weryfikacja |
|---|---|---|
| NFR-01 | Dla tych samych danych początkowych, wejść i ticków silnik generuje identyczny stan | Testy deterministyczne w lekcjach silnika |
| NFR-02 | Silnik nie zależy od Reacta, DOM, Canvas, WebSocket ani bazy danych | Kontrola zależności i testy jednostkowe |
| NFR-03 | Klient nie może samodzielnie ustalić ani zmienić autorytatywnego wyniku meczu | Testy odrzucenia fałszywego wyniku i wejść po zakończeniu meczu |
| NFR-04 | Dane wejściowe na granicach sieciowych są walidowane kontraktami; działania w pokoju wymagają autoryzowanej sesji uczestnika | Testy błędnych payloadów, próby przejęcia sesji i dostępu trzeciego gracza |
| NFR-05 | MVP można uruchamiać i testować lokalnie bez wymagania konta AWS | Instrukcja uruchomienia i test integracyjny |
| NFR-06 | Sekrety i konfiguracja środowiskowa nie są wpisywane na stałe w kodzie | Review konfiguracji |
| NFR-07 | Dokumentacja wiąże wymagania z kryteriami akceptacji i dowodami | Macierz śledzenia |

### Parametry do późniejszej decyzji

Docelowa częstotliwość ticków, limity opóźnień, częstotliwość snapshotów, limity ruchu, budżety wydajności i docelowa liczba równoczesnych meczów **nie są jeszcze zatwierdzone**. **Zatwierdzono 30-sekundowy timeout reconnect** liczony od wykrycia rozłączenia przez serwer (D-04). Pozostałe parametry wymagają osobnych pomiarów i specyfikacji. Nie należy interpretować ich braku jako zgody na dowolne zachowanie.

## 6. Założenia i zależności

- Docelowy stack i kolejność lekcji wynikają z `syllabus.md`.
- Jedna sesja MVP obejmuje maksymalnie dwóch aktywnych graczy.
- Aktywny stan meczu w początkowej wersji jest przechowywany w pamięci procesu; utrata procesu może przerwać mecz.
- PostgreSQL służy danym trwałym; Redis i infrastruktura AWS są wprowadzane później.
- Punktacja, ataki, szczegółowa definicja top-out i kolejność zdarzeń wewnątrz ticka wymagają dalszych specyfikacji; zasada remisu przy jednoczesnym top-out jest już zatwierdzona.
- Zgodnie z D-05 wsparcie obowiązkowe dotyczy desktopu i klawiatury; lista wersji przeglądarek, mapowanie klawiszy i zachowanie przy utracie focusu pozostają otwarte.

## 7. Rejestr decyzji produktowych

| ID | Decyzja zatwierdzona podczas review | Konsekwencje |
|---|---|---|
| D-01 | Kod i link, wspólny mechanizm | Jeden identyfikator zaproszenia i wspólna walidacja; kod nie uprawnia do przejęcia sesji |
| D-02 | Dostęp gościnny bez obowiązkowego konta | Sesja gościa uprawnia do sterowania własnym miejscem w pokoju; nie wyklucza przyszłych profili |
| D-03 | Knockout 1v1 | Pojedynczy top-out = przegrana; dwa top-out w tym samym ticku = remis; rezygnacja = przegrana |
| D-04 | Reconnect: symulacja trwa, okno 30 s | Czas liczony przez serwer od wykrycia rozłączenia; brak wejść zastępczych; wcześniejszy wynik końcowy ma pierwszeństwo |
| D-05 | Desktop + klawiatura w M2/M3 | Mobile, dotyk i gamepad poza zakresem obowiązkowym MVP |

### Nierozstrzygnięte szczegóły (nie są częścią zatwierdzenia D-01–D-05)

1. Format, entropia i okres ważności kodu/linku zaproszenia.
2. Reguły wielokrotnych reconnectów i jednoczesnego rozłączenia obu graczy; kolejność zdarzeń na granicy timeoutu.
3. Obsługiwane przeglądarki i wersje, mapowanie klawiszy, DAS/ARR i utrata focusu.
4. Definicja top-out i szczegółowa kolejność zdarzeń symulacji, reguły ataków i punktacji.
5. Zakres endpointów i model danych FR-10, z zachowaniem niezależności dostępu gościnnego od konta.

## 7a. Kandydaci na kryteria akceptacji do `spec.md`

| ID | Weryfikowalne zachowanie | Powiązanie |
|---|---|---|
| AC-INV-01 | Kod i odpowiadający mu link dołączają do tego samego pokoju | FR-03 |
| AC-INV-02 | Próba dołączenia trzeciego gracza jest odrzucana bez zmiany składu pokoju | FR-04 |
| AC-GUEST-01 | Dwaj goście mogą utworzyć pokój, dołączyć i rozpocząć mecz bez logowania | FR-03, FR-04 |
| AC-MATCH-01 | Top-out wyłącznie A daje zwycięstwo B; top-out wyłącznie B daje zwycięstwo A | FR-05 |
| AC-MATCH-02 | Top-out A i B w tym samym ticku daje remis | FR-05 |
| AC-MATCH-03 | Rezygnacja A w aktywnym meczu daje zwycięstwo B | FR-05 |
| AC-MATCH-04 | Fałszywa deklaracja wyniku i wejście po zakończeniu nie zmieniają wyniku | FR-05, FR-09, NFR-03 |
| AC-REC-01 | Rozłączenie A nie zatrzymuje symulacji ani przetwarzania poprawnych wejść B | FR-08 |
| AC-REC-02 | Poprawnie uwierzytelniony reconnect A przed upływem 30 s dostarcza aktualny snapshot trwającego meczu | FR-08 |
| AC-REC-03 | Brak reconnect przez 30 s kończy trwający mecz wynikiem DISCONNECT_TIMEOUT na niekorzyść A | FR-08 |
| AC-REC-04 | Top-out podczas rozłączenia kończy mecz przed timeoutem; reconnect nie wznawia zakończonego meczu | FR-05, FR-08 |
| AC-REC-05 | Sama znajomość kodu pokoju nie umożliwia przejęcia sesji; stare połączenie nie może sterować po reconnect | FR-09 |
| AC-INPUT-01 | W wybranych do specyfikacji przeglądarkach desktopowych klawiatura wywołuje poprawne komendy ruchu | FR-01, FR-02 |
| AC-INPUT-02 | Niezmapowany klawisz nie generuje komendy; identyczne komendy dają identyczny wynik silnika | FR-02, NFR-01 |

**Uwaga:** AC-REC dla powtarzanych rozłączeń i granicznego timeoutu oraz dokładny zakres AC-INPUT-01 pozostają niekompletne do czasu decyzji szczegółowych. Powyższa tabela to kandydaci do późniejszego review `spec.md`, nie dowody wykonanych testów.

## 8. Warunek zatwierdzenia

Właściciel projektu zatwierdza zakres M3, wykluczenia, wymagania FR/NFR oraz jawnie akceptuje otwarte decyzje jako tematy do późniejszej specyfikacji. Samo zatwierdzenie tego dokumentu nie oznacza ukończenia lekcji 01.
