import type { IncomingMessage } from "node:http";
import { SESSION_TTL_MS, hashToken, readSessionToken } from "../auth/session-cookie";
import { insertGame } from "../db/games";
import { insertMatch } from "../db/matches";
import type { Db } from "../db/pool";
import { log } from "../observability/logger";
import { gameSaveErrors } from "../observability/metrics";
import { useSession, type SessionUser } from "../db/sessions";
import type { MatchResult } from "../rooms/room";
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
      (error: unknown) => {
        gameSaveErrors.inc();
        log.error({ err: error, userId: session.userId }, "failed to save game");
      },
    );
  };
}

/** Zapisuje każdy mecz 1v1, także gości (spec 007, R5); jak przy grach, poza pętlą ticków. */
export function saveMatchResult(db: Db) {
  return (result: MatchResult): Promise<void> =>
    insertMatch(db, {
      winner: {
        userId: result.winner.userId,
        name: result.winner.name,
        linesSent: result.winnerLinesSent,
      },
      loser: {
        userId: result.loser.userId,
        name: result.loser.name,
        linesSent: result.loserLinesSent,
      },
      reason: result.reason,
      ticks: result.ticks,
    }).then(
      () => undefined,
      (error: unknown) => {
        gameSaveErrors.inc();
        log.error({ err: error }, "failed to save match");
      },
    );
}
