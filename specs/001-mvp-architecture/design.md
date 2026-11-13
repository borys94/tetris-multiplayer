# Design — architektura docelowa Multiplayer Tetris

- **ID:** 001-mvp-architecture
- **Wersja:** 0.2
- **Status:** Approved — zatwierdzono merytorycznie przez właściciela
- **Decyzja ogólna:** zachowano kierunek i kandydatów ADR-001–ADR-005; uzupełniono projekt względem zatwierdzonych `requirements.md` v0.2 i `spec.md` v0.3. Dokument został zatwierdzony merytorycznie przez właściciela.

## 1. Cele architektoniczne

1. Umożliwić etapowe dostarczenie single-player, następnie 1v1 i późniejszych funkcji.
2. Utrzymać reguły gry niezależnie od UI, transportu i infrastruktury.
3. Zapewnić autorytatywność serwera bez blokowania późniejszej predykcji klienta.
4. Ograniczyć koszty i złożoność operacyjną w początkowych etapach.

## 2. Kontekst i komponenty

```text
Przeglądarka desktopowa (React + Canvas)
  Keyboard Adapter -> komendy domenowe -> lokalny game-engine (M2 / predykcja)
  | HTTPS: zasoby / przyszłe profile / historia
  | WebSocket: intencje, snapshoty, reconnect, wynik
  v
Node.js + Fastify (modularny monolit)
  |-- REST API (operacje zasobowe; FR-10 szczegóły odroczone)
  |-- WebSocket Gateway + Zod (schemat, kontekst połączenia)
  |-- Guest Session (tożsamość i odzyskanie uprawnień)
  |-- Room & Invitation (jeden identyfikator kodu/linku, limit dwóch miejsc)
  |-- Match Session (autorytatywny tick, walidacja, knockout, reconnect)
  |     +-- game-engine (deterministyczne przejścia i zdarzenia domenowe)
  |-- Moduły profili i historii (późniejsze kontrakty)
  |-- contracts (współdzielone schematy)
  +-- PostgreSQL / Drizzle (trwałe dane, nie ticki aktywnego meczu)

Później: Redis, Docker, AWS ECS Fargate, RDS, S3/CloudFront,
Terraform i obserwowalność zgodnie z syllabusem.
```

**Granice zaufania:** kod/link zaproszenia pozwala ubiegać się o wolne miejsce, ale **nie** jest poświadczeniem tożsamości już przypisanego uczestnika. Guest Session wiąże uprawnienie do miejsca z odrębną tożsamością sesji; Gateway sprawdza kontekst połączenia, a Match Session ostatecznie autoryzuje operację. Szczegółowy format poświadczeń i okres ich ważności pozostają do L27–30.

## 3. Proponowane granice kodu (docelowy szkic, nie istniejące pliki)

```text
apps/
  web/                   # React, Canvas, wejście użytkownika, prezentacja
  server/                # Fastify, transport, sesje, trwałość
packages/
  game-engine/           # czyste przejścia stanu gry
  contracts/             # Zod, DTO, wersjonowanie protokołu
specs/
  001-mvp-architecture/
docs/
  adr/                   # formalizacja ADR w lekcji 04
```

### Reguły zależności

- `game-engine` nie importuje Reacta, DOM, Canvas, Fastify, WebSocket, ORM ani bazy danych.
- `contracts` nie zawiera logiki gameplayu ani dostępu do infrastruktury.
- `web` może korzystać z `game-engine` dla symulacji lokalnej, ale nie decyduje o autorytatywnym wyniku meczu; mapowanie klawiatury jest adapterem frontendu, nie częścią silnika.
- `server` jest właścicielem stanu aktywnej sesji i waliduje wejścia.
- Moduły backendu komunikują się przez jawne interfejsy, nie przez niekontrolowane importy szczegółów implementacyjnych.
- Reguły importów i graf zależności runtime `game-engine` podlegają statycznej kontroli (S-19); testy silnika nie wymagają przeglądarki ani serwera. Narzędzia developerskie i dozwolone zależności ustalimy w L03.

## 4. Model odpowiedzialności i cykl życia

| Komponent | Odpowiedzialność | Czego nie robi |
|---|---|---|
| Game Engine | Deterministyczne przejścia stanu, reguły i informacje o `top-out` | Transport, sesje, renderowanie, DB, ostateczna decyzja sieciowa o wyniku |
| Web + Keyboard Adapter | Mapowanie klawiszy na komendy, Canvas, opcjonalna predykcja i reconciliation | Autorytatywne rozstrzyganie meczu |
| Room & Invitation | Utworzenie prywatnego pokoju, kod i link z jednym identyfikatorem, wspólna walidacja dołączenia, maks. dwa miejsca | Uwierzytelnianie prawa do przejęcia istniejącego miejsca |
| Guest Session | Tożsamość gościa, powiązanie z miejscem, weryfikacja odzyskania sesji i zastąpienie połączenia | Uznawanie samego kodu zaproszenia za dowód własności miejsca |
| Match Session | Jeden autorytatywny stan, ticki, kolejność i dopuszczalność wejść, cykl życia, timeouty, **jednorazowe** ustalenie wyniku | Rendering, zaufanie do wyniku przesłanego przez klienta |
| WebSocket Gateway | Parsowanie, Zod, uwierzytelniony kontekst połączenia, przekazanie komunikatu | Reguły gry i samodzielne rozstrzyganie wyniku |
| REST API | Operacje zasobowe i przyszłe API profili (FR-10 — deferred) | Strumieniowanie wejść |
| Persistence | Dane trwałe i transakcje | Zapis planszy w każdym ticku |

### Stany i wynik

- Uproszczony cykl meczu: `WAITING -> ACTIVE -> FINISHED`. Rozłączenie jest **stanem połączenia uczestnika**, a nie stanem `PAUSED` meczu.
- `Match Session` przyjmuje uporządkowane wejścia i informacje o `top-out` z silnika, rozstrzyga wynik według D-03 i przechodzi do `FINISHED` dokładnie raz. Po zakończeniu wejścia i fałszywe deklaracje wyniku nie mogą zmienić rezultatu (S-11–S-13, S-18).
- `top-out` tylko A oznacza zwycięstwo B i odwrotnie; `top-out` obu w **tym samym ticku** oznacza remis; autoryzowany `FORFEIT` oznacza przegraną rezygnującego. Sam disconnect nie jest `FORFEIT`.
- Wcześniejszy prawidłowy wynik meczu ma pierwszeństwo przed timeoutem. Kolejność zdarzeń w tym samym ticku oraz dokładnie na granicy timeoutu wymaga odrębnej decyzji przed L29–30.

## 5. Determinizm i dwa źródła czasu

Silnik wyznacza przejścia z jawnego stanu, uporządkowanych wejść, numeru ticka i kontrolowanego źródła losowości. Nie używa `Date.now()` ani `Math.random()` jako ukrytych wejść. Kontrakt i tick rate: L06–15.

**Czas symulacji** jest logiczny (tick). **Czas reconnect** jest odmierzany przez serwer od wykrycia rozłączenia i wynosi **30 s** (D-04). `Match Session` korzysta z abstrahowanego zegara/timera serwera, umożliwiającego testy timeoutu bez oczekiwania w czasie rzeczywistym. Zegar ścienny nie wpływa bezpośrednio na deterministyczne reguły silnika.

## 6. Przepływy multiplayer i walidacja

### Utworzenie pokoju i dołączenie

1. Gość bez logowania tworzy prywatny pokój; `Room & Invitation` wydaje kod i link odnoszące się do **tego samego** identyfikatora zaproszenia i wspólnej ścieżki walidacji.
2. Drugi gość dołącza kodem lub linkiem; zajęte są maksymalnie dwa miejsca. Trzecia próba nie zmienia składu.
3. `Guest Session` ustanawia odrębne uprawnienie do własnego miejsca. Kod zaproszenia nie daje prawa do odzyskania ani przejęcia istniejącej sesji (S-02, S-10, S-14).

### Wejścia i snapshoty

1. `Keyboard Adapter` mapuje klawisze na komendy domenowe; klient wysyła intencję z kontekstem sekwencji. Opcjonalna predykcja lokalna nie jest źródłem prawdy.
2. Gateway weryfikuje schemat Zod i kontekst połączenia; `Match Session` sprawdza prawo do miejsca, aktualność, duplikaty, epokę, stan meczu i reguły wejścia. Nieprawidłowe, nieaktualne, powtórzone i nieautoryzowane wejścia nie zmieniają stanu (S-04, S-08, S-18).
3. Silnik oblicza przejście; Match Session wylicza autorytatywny stan/wynik. Serwer publikuje snapshot z kontekstem meczu/epoki, tickiem i potwierdzeniami wejść.
4. Klient odrzuca nieaktualne snapshoty i rekoncyliuje stan z odpowiednimi niepotwierdzonymi wejściami (S-03, S-05, S-06, S-16).

**Odroczone:** konkretne DTO, okno aktualności wejść, snapshot rate, limity RTT, retry i kody błędów — L26–30. Walidacja Zod nie zastępuje autoryzacji ani kontroli stanu domenowego.

### Rozłączenie i reconnect (D-04)

1. Serwer wykrywa utratę połączenia A, zapisuje początek 30-sekundowego okna według czasu serwera. **Nie pauzuje** symulacji żadnej planszy i **nie generuje wejść zastępczych** za A; B może nadal grać.
2. Przed terminem A może odzyskać **swoją** sesję po weryfikacji uprawnienia do miejsca. Nowe połączenie przejmuje uprawnienia; stare nie może już sterować. Jeśli mecz trwa, A dostaje aktualny snapshot.
3. Jeśli w trakcie rozłączenia mecz zakończył się poprawnie, wynik pozostaje końcowy i może zostać odzyskany przez uprawnionego uczestnika; reconnect nie wznawia meczu.
4. Jeżeli 30 s upłynie bez skutecznego odzyskania sesji, a mecz nadal jest `ACTIVE`, `Match Session` kończy go przegraną A z powodem `DISCONNECT_TIMEOUT`.

**Otwarte:** wielokrotne reconnecty, jednoczesne rozłączenie obu graczy, zdarzenia dokładnie na granicy 30 s i semantyka kolizji zdarzeń — L30. Nie zakładamy ukrytej polityki tych przypadków. Zerwanie WebSocket nie jest tym samym co awaria procesu serwera (por. §8).

## 7. Decyzje i kompromisy (kandydaci na ADR)

### ADR-001 — Modularny monolit

- **Wybór:** jeden backend z granicami modułów.
- **Alternatywa:** mikroserwisy.
- **Korzyść:** prostsze testowanie, uruchamianie i deployment.
- **Koszt:** wspólne wdrożenie, ryzyko sprzężeń między modułami.
- **Warunek:** kontrola importów i kontraktów.

### ADR-002 — Współdzielony deterministyczny Game Engine

- **Wybór:** jedna biblioteka reguł w TypeScript.
- **Alternatywa:** niezależne silniki klienta i serwera.
- **Korzyść:** mniejsze ryzyko rozbieżności, testowalność i przyszły replay.
- **Koszt:** dyscyplina czasu, losowości i zgodności wersji.

### ADR-003 — Server-authoritative

- **Wybór:** serwer wylicza stan i wynik; klient wysyła intencje.
- **Alternatywa:** klient wylicza wynik i raportuje go serwerowi.
- **Korzyść:** mniejsza powierzchnia oszustw.
- **Koszt:** synchronizacja, obsługa opóźnień i reconciliation.

### ADR-004 — REST + WebSocket

- **Wybór:** REST dla zasobów, WebSocket dla rozgrywki.
- **Alternatywa:** jeden protokół do wszystkich operacji.
- **Korzyść:** dopasowanie transportu do potrzeb.
- **Koszt:** dwa modele API i dwa rodzaje testów.

### ADR-005 — Local-first, infrastruktura etapami

- **Wybór:** rozwój lokalny; Docker i AWS zgodnie z syllabusem.
- **Alternatywa:** pełne AWS od pierwszego dnia.
- **Korzyść:** mniejszy koszt i krótsza pętla informacji zwrotnej.
- **Koszt:** późniejsza praca integracyjna; ograniczamy ją konfiguracją środowiskową i izolacją infrastruktury.

## 8. Dane i trwałość

- Aktywne mecze: pamięć procesu backendu w początkowym MVP.
- Dane trwałe: PostgreSQL + Drizzle.
- Redis: później dla obecności/matchmakingu i elementów architektury rozproszonej.
- Awaria procesu może przerwać aktywny mecz; polityka odzyskiwania wymaga osobnej decyzji.

## 9. Bezpieczeństwo, konfiguracja i niezawodność

- **Warstwy walidacji:** (1) struktura/wersja wiadomości w Gateway (Zod); (2) tożsamość sesji, uprawnienie do miejsca i aktualne połączenie; (3) epoka, tick, sekwencja, duplikaty i aktualność; (4) stan meczu i reguły domenowe w Match Session / silniku. Każde odrzucenie nie zmienia autorytatywnego stanu (S-04, S-08, S-14, S-18).
- Nie przyjmujemy od klienta autorytatywnych punktów, planszy ani wyniku. Po `FINISHED` wynik jest niezmienny.
- Kod/link zaproszenia nie jest sekretem do przejęcia sesji; stara sesja transportowa po poprawnym reconnect traci prawo sterowania.
- Konfiguracja środowiskowa i prawdziwe sekrety nie są wpisywane na stałe w śledzony kod; lokalne uruchomienie używa udokumentowanego mechanizmu konfiguracji. Review i skanowanie sekretów w CI (S-20) zmniejszają ryzyko, lecz nie zapewniają wykrycia wszystkich sekretów.
- Kontrola granic importów i zależności `game-engine` oraz testy bez UI/serwera egzekwują S-19. Konkretny zestaw reguł i narzędzi: L03/L05.
- Limity ruchu, format poświadczeń i szczegółowe kody błędów wymagają osobnej specyfikacji; nie deklarujemy odporności na awarie procesu ani gwarancji dostępności.

## 10. Ryzyka

| Ryzyko | Skutek | Redukcja |
|---|---|---|
| Niejednakowy wynik symulacji | Desynchronizacja | Testy deterministyczne, jawny seed i tick |
| Duplikaty i zmiana kolejności komunikatów | Podwójne ruchy lub cofnięcie stanu | Sekwencje, wersjonowanie, idempotencja |
| Nieuczciwy klient | Manipulacja wynikiem | Walidacja i autorytatywny serwer |
| Awaria procesu | Przerwanie aktywnego meczu | Jawna polityka MVP, późniejsze snapshoty/odporność |
| Naruszenie granic modułów | Trudna refaktoryzacja | Reguły zależności, review |
| Przedwczesne skalowanie | Koszt i złożoność | Infrastruktura etapowa |

## 11. Rejestr decyzji i otwartych kontraktów

### Zatwierdzone decyzje produktowe (źródło: `requirements.md` v0.2)

| ID | Ustalenie | Konsekwencja w projekcie |
|---|---|---|
| D-01 | Kod i link używają jednego mechanizmu zaproszenia | Room & Invitation, wspólna walidacja; kod nie autoryzuje przejęcia miejsca |
| D-02 | Dostęp gościnny bez logowania | Guest Session odrębna od przyszłych profili |
| D-03 | Knockout: jednostronny top-out, remis w tym samym ticku, `FORFEIT` | Match Session ustala jeden niezmienny wynik |
| D-04 | Symulacja trwa; reconnect 30 s czasu serwera; brak wejść zastępczych | Zegar serwera, weryfikacja sesji, snapshot, `DISCONNECT_TIMEOUT` |
| D-05 | Desktop i klawiatura M2/M3 | Keyboard Adapter w web; brak obowiązku mobile/touch/gamepad |

### Otwarte — wymagają osobnych decyzji przed implementacją

| Kontrakt | Kiedy | Co pozostaje otwarte |
|---|---|---|
| Silnik | L06–15, L29 | Tick rate, definicja `top-out`, kolejność zdarzeń ticka, ataki i punktacja |
| Frontend | L16–20 | Mapowanie klawiszy, focus, DAS/ARR, lista przeglądarek |
| Profile / trwałość (FR-10 / S-17) | L21–24 | Endpointy, modele, schematy, autoryzacja i błędy; guest access pozostaje niezależny |
| Protokół i walidacja | L26–27 | DTO, okno aktualności wejść, epoki, błędy, limity ruchu |
| Zaproszenia i sesje | L27–28 | Entropia, format i ważność kodu/linku; poświadczenia sesji |
| Reconnect | L30 | Wielokrotne reconnecty, jednoczesne rozłączenie, zdarzenia dokładnie na granicy timeoutu |
| Operacje | L30, L55+ | Odzyskiwanie po awarii procesu, skalowanie i trwałość aktywnych meczów |

## 12. Macierz traceability projektu

| Wymaganie / decyzja | Scenariusze `spec.md` v0.3 | Element projektu / weryfikacja |
|---|---|---|
| FR-01, FR-02, D-05 | S-01, S-15 | §3–6: Keyboard Adapter i niezależny Game Engine; testy komend |
| NFR-01, NFR-02 | S-01, S-19 | §3, §5, §9: jawne ticki/seed, kontrola grafu zależności i testy bez UI |
| FR-03, FR-04, D-01, D-02 | S-02, S-10, S-14 | §2, §4, §6: Room & Invitation, Guest Session, dwa miejsca |
| FR-05, D-03 | S-11, S-12, S-13 | §4: pojedynczy wynik knockout i niezmienność `FINISHED` |
| FR-06, NFR-03 | S-03, S-11, S-13 | §4, §6, §9: autorytatywna Match Session, brak zaufania do klienta |
| FR-07 | S-03, S-16 | §6: aktualizacje online i odzyskiwanie końcowego wyniku |
| FR-08, D-04 | S-05, S-06, S-07, S-14, S-16 | §5–6: dwa zegary, 30 s, snapshot i przejęcie połączenia |
| FR-09, NFR-04 | S-04, S-08, S-13, S-14, S-18 | §2, §4, §6, §9: warstwowa walidacja i uprawnienia |
| FR-10 | S-17 (Deferred specification) | §2, §4, §11: API i dane trwałe, szczegóły odroczone L21–24 |
| NFR-05 | S-09 | §2, §7 (ADR-005), §8: lokalne uruchomienie bez AWS |
| NFR-06 | S-09, S-20 | §9: konfiguracja poza kodem, review i skan sekretów |
| NFR-07 | AC-01–AC-06, macierz specyfikacji | §12: powiązanie wymagań, scenariuszy i komponentów; dowody implementacji dopiero później |

**Mapowanie kandydatów AC produktu:** AC-INV-01/02 → Room & Invitation (§6); AC-GUEST-01 → Guest Session (§4/§6); AC-MATCH-01–04 → Match Session (§4); AC-REC-01–05 → reconnect i sesje (§5/§6); AC-INPUT-01/02 → Keyboard Adapter (§3/§6). Pełne testy produktu powstaną w odpowiednich lekcjach.

## 13. Review i status

Kierunek ADR-001–ADR-005 zachowano jako kandydatów na formalne ADR (L04); nie twierdzimy, że zostały już zapisane i zatwierdzone osobne pliki ADR. `requirements.md` v0.2, `spec.md` v0.3 i niniejszy `design.md` v0.2 zostały merytorycznie zatwierdzone przez właściciela w rozmowie; metadane dokumentów mają status `Approved`. Zatwierdzenie projektu nie jest dowodem implementacji ani uruchomienia testów; spełnienie AC-06 wymaga osobnej kontroli spójności całego pakietu SDD.
