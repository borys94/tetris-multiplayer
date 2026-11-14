import type { Db } from "./pool";
import type { Role } from "./users";

/** Zalogowany użytkownik widziany przez API i WebSocket. */
export interface SessionUser {
  id: number;
  username: string;
  role: Role | null;
}

export async function createSession(
  db: Db,
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
  db: Db,
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

export async function deleteSession(db: Db, tokenHash: Buffer): Promise<void> {
  await db.query("delete from sessions where id = $1", [tokenHash]);
}

/** Usuwa wygasłe sesje; zwraca ich liczbę. */
export async function deleteExpiredSessions(db: Db): Promise<number> {
  const { rowCount } = await db.query("delete from sessions where expires_at <= now()");
  return rowCount ?? 0;
}
