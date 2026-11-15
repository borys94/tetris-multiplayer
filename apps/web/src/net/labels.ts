import type { ErrorCode } from "@tetris/protocol";
import type { ConnectionStatus } from "./connection";

export const STATUS_LABELS: Readonly<Record<ConnectionStatus, string>> = {
  connecting: "Łączenie z serwerem…",
  online: "Połączono",
  offline: "Brak połączenia, ponawiam…",
  closed: "Rozłączono (gra otwarta w innej karcie?)",
};

/** Błędy połączenia z serwerem gry pokazywane graczowi; błędy protokołu pomijamy. */
export const CONNECTION_ERRORS: Partial<Readonly<Record<ErrorCode, string>>> = {
  server_full: "Serwer jest pełny, spróbuj za chwilę",
  version: "Nowa wersja gry: odśwież stronę",
};

/** Błędy pokoi 1v1 (spec 007). */
export const ROOM_ERRORS: Partial<Readonly<Record<ErrorCode, string>>> = {
  room_not_found: "Nie ma takiego pokoju albo został zamknięty",
  room_full: "Pokój jest pełny albo mecz już trwa",
  room_limit: "Masz już otwarty pokój",
  login_required: "Pokój prywatny wymaga zalogowania",
  server_full: CONNECTION_ERRORS.server_full!,
};
