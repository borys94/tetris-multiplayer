import { LIST_LIMIT, type Queryable } from "./pool";

export type Role = "admin";

export interface User {
  id: number;
  username: string;
  /** `null` oznacza gracza (jedyna rola to admin). */
  role: Role | null;
  disabled: boolean;
  createdAt: Date;
}

export interface UserWithPassword extends User {
  passwordHash: string;
}

interface UserRow {
  id: number;
  username: string;
  password_hash: string;
  role: Role | null;
  disabled_at: Date | null;
  created_at: Date;
}

const COLUMNS = "id, username, password_hash, role, disabled_at, created_at";

function toUser(row: UserRow): UserWithPassword {
  return {
    id: row.id,
    username: row.username,
    role: row.role,
    disabled: row.disabled_at !== null,
    createdAt: row.created_at,
    passwordHash: row.password_hash,
  };
}

/** Bez hasha hasła, np. do odpowiedzi API. */
export function publicUser(user: UserWithPassword): User {
  const { id, username, role, disabled, createdAt } = user;
  return { id, username, role, disabled, createdAt };
}

/** Tworzy konto; zwraca `null`, gdy login jest zajęty. */
export async function createUser(
  db: Queryable,
  username: string,
  passwordHash: string,
): Promise<User | null> {
  const { rows } = await db.query<UserRow>(
    `insert into users (username, password_hash) values ($1, $2)
     on conflict (username) do nothing returning ${COLUMNS}`,
    [username, passwordHash],
  );
  return rows[0] ? publicUser(toUser(rows[0])) : null;
}

export async function findUserByUsername(
  db: Queryable,
  username: string,
): Promise<UserWithPassword | null> {
  const { rows } = await db.query<UserRow>(`select ${COLUMNS} from users where username = $1`, [
    username,
  ]);
  return rows[0] ? toUser(rows[0]) : null;
}

export async function findUserById(db: Queryable, id: number): Promise<User | null> {
  const { rows } = await db.query<UserRow>(`select ${COLUMNS} from users where id = $1`, [id]);
  return rows[0] ? publicUser(toUser(rows[0])) : null;
}

/** Konta, których login zawiera `query` (bez niego: najnowsze), maks. `LIST_LIMIT`. */
export async function searchUsers(db: Queryable, query: string): Promise<User[]> {
  const pattern = `%${query.replace(/[\\%_]/g, "\\$&")}%`;
  const { rows } = await db.query<UserRow>(
    `select ${COLUMNS} from users where username like $1 order by created_at desc limit $2`,
    [pattern, LIST_LIMIT],
  );
  return rows.map((row) => publicUser(toUser(row)));
}

export async function setRole(db: Queryable, id: number, role: Role | null): Promise<boolean> {
  const { rowCount } = await db.query("update users set role = $2 where id = $1", [id, role]);
  return rowCount === 1;
}

/**
 * Blokuje lub odblokowuje konto. Sesji nie usuwa: `useSession` i tak pomija zablokowane
 * konta, a wylogowanie ze wszystkich urządzeń to reguła warstwy kont (`accounts/admin`).
 */
export async function setDisabled(db: Queryable, id: number, disabled: boolean): Promise<boolean> {
  const { rowCount } = await db.query(
    "update users set disabled_at = case when $2 then coalesce(disabled_at, now()) end where id = $1",
    [id, disabled],
  );
  return rowCount === 1;
}

export async function setPasswordHash(
  db: Queryable,
  id: number,
  passwordHash: string,
): Promise<boolean> {
  const { rowCount } = await db.query("update users set password_hash = $2 where id = $1", [
    id,
    passwordHash,
  ]);
  return rowCount === 1;
}
