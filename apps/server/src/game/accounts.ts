import type { IncomingMessage } from "node:http";
import { SESSION_TTL_MS, hashToken, readSessionToken } from "../auth/session-cookie";
import { insertGame } from "../db/games";
import type { Db } from "../db/pool";
import { useSession, type SessionUser } from "../db/sessions";
import type { GameOver, Session } from "./session";

/** Użytkownik z cookie przy upgrade WebSocketu; `null` to gość (spec 005). */
export function authenticateWebSocket(db: Db) {
  return async (req: IncomingMessage): Promise<SessionUser | null> => {
    const token = readSessionToken(req);
    return token ? useSession(db, hashToken(token), new Date(Date.now() + SESSION_TTL_MS)) : null;
  };
}

/**
 * Zapisuje wynik gry zalogowanego gracza. Zapis idzie poza pętlą ticków:
 * błąd bazy nie zatrzymuje gry, trafia tylko do logu. Zwraca obietnicę (do testów).
 */
export function saveGameResult(db: Db) {
  return (session: Session, result: GameOver): Promise<void> => {
    if (session.userId === null) return Promise.resolve();
    return insertGame(db, session.userId, result).then(
      () => undefined,
      (error: unknown) => console.error("failed to save game", error),
    );
  };
}
