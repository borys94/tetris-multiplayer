export type View = "game" | "versus" | "ranking" | "account" | "admin";

const ROUTES: Readonly<Record<string, View>> = {
  "#/1v1": "versus",
  "#/ranking": "ranking",
  "#/konto": "account",
  "#/admin": "admin",
};

/** Kod pokoju z linku `#/pokoj/<kod>`. */
export const ROOM_LINK = /^#\/pokoj\/([A-Za-z0-9]{6})$/;

/** Link do pokoju dla przeciwnika. */
export function roomLink(code: string): string {
  return `${window.location.origin}${window.location.pathname}#/pokoj/${code}`;
}

export function viewOf(hash: string): View {
  if (ROOM_LINK.test(hash)) return "versus";
  return ROUTES[hash] ?? "game";
}
