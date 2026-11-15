import type { Queryable } from "./pool";
import type { Role } from "./users";

/** Zalogowany użytkownik widziany przez API i WebSocket. */
export interface SessionUser {
  id: number;
  username: string;
  role: Role | null;
}

export async function createSession(
  db: Queryable,
  tokenHash: Buffer,
  userId: number,
  expiresAt: Date,
): Promise<void> {
  await db.query("insert into sessions (id, user_id, expires_at) values ($1, $2, $3)", [
    tokenHash,
    userId,
    expiresAt,
  ]);
}

/**
 * Użytkownik ważnej sesji; przedłuża ją do `extendTo`. Sesje wygasłe
 * i sesje zablokowanych kont są ignorowane.
 */
export async function useSession(
  db: Queryable,
  tokenHash: Buffer,
  extendTo: Date,
): Promise<SessionUser | null> {
  const { rows } = await db.query<SessionUser>(
    `update sessions s set expires_at = greatest(s.expires_at, $2)
     from users u
     where s.id = $1 and u.id = s.user_id and s.expires_at > now() and u.disabled_at is null
     returning u.id, u.username, u.role`,
    [tokenHash, extendTo],
  );
  return rows[0] ?? null;
}

export async function deleteSession(db: Queryable, tokenHash: Buffer): Promise<void> {
  await db.query("delete from sessions where id = $1", [tokenHash]);
}

/** Wylogowuje konto ze wszystkich urządzeń (np. po zmianie hasła przez admina). */
export async function deleteUserSessions(db: Queryable, userId: number): Promise<void> {
  await db.query("delete from sessions where user_id = $1", [userId]);
}

/** Usuwa wygasłe sesje; zwraca ich liczbę. */
export async function deleteExpiredSessions(db: Queryable): Promise<number> {
  const { rowCount } = await db.query("delete from sessions where expires_at <= now()");
  return rowCount ?? 0;
}
