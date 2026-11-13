# Requirements — Lesson 004: dokumentacja, ADR, konwencje i szablony SDD

**Status:** Approved — zatwierdzono przez właściciela 2026-11-13  
**Specification:** [spec.md](./spec.md)

## Cel

Ujednolicić sposób dokumentowania zmian: wspólne konwencje, szablony SDD i format ADR, tak aby kolejne lekcje tworzyły zwięzłe, śledzone dokumenty bez ręcznego wymyślania struktury.

## Zakres

Wyłącznie dokumentacja w `docs/` i `specs/004-documentation-sdd/`. Bez zmian kodu aplikacji, konfiguracji narzędzi i infrastruktury.

## Wymagania

- **REQ-001 — Szablony SDD:** istnieją cztery szablony (`requirements`, `spec`, `design`, `tasks`) gotowe do skopiowania do `specs/NNN-slug/`.
- **REQ-002 — Konwencje:** jeden dokument opisuje strukturę dokumentacji, nazewnictwo, statusy, identyfikatory i zasady śledzenia REQ → SPEC → TASK → AC.
- **REQ-003 — Format ADR:** konwencje określają, kiedy tworzyć ADR, jak go nazwać i jakie sekcje zawiera.
- **REQ-004 — Przykładowy ADR:** decyzja o server-authoritative multiplayer jest zapisana jako ADR ze statusem `Proposed` (`Accepted` wyłącznie po decyzji właściciela); nie przedstawia multiplayera jako zaimplementowanego.
- **REQ-005 — Ograniczenia:** treść opisowa po polsku, identyfikatory i nazwy plików po angielsku; dokumenty zwięzłe, bez powielania `AGENTS.md` i istniejących specyfikacji.

## Kryteria akceptacji

Zmiana jest zakończona, gdy AC-001–AC-006 ze [spec.md](./spec.md#3-weryfikacja) mają wynik `PASS`, a PR przeszedł review.

## Poza zakresem

- Formalizacja pozostałych kandydatów ADR (001: ADR-001, 002, 004, 005; L03) i rozstrzygnięcie K-01 (Fastify vs Express).
- Migracja identyfikatorów w `specs/001`–`003`.
- Automatyczny lint Markdown i sprawdzanie linków w CI (L05).
- Aktualizacja `progress.md` (po zgodzie właściciela).
