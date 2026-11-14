import pg from "pg";
import { MIGRATIONS } from "./migrations";

export type Db = pg.Pool;

// Identyfikatory to bigint; przy naszej skali mieszczą się w number, więc nie zwracamy stringów.
pg.types.setTypeParser(pg.types.builtins.INT8, Number);

/** Pula połączeń; mała, bo serwer i baza dzielą jeden węzeł z 2 GB RAM (ADR-0008). */
export function createPool(connectionString: string): Db {
  return new pg.Pool({ connectionString, max: 5, idleTimeoutMillis: 30_000 });
}

/** Dowolny numer blokady doradczej zarezerwowany na migracje. */
const MIGRATION_LOCK = 4_242_005;

/**
 * Stosuje brakujące migracje, każdą w osobnej transakcji. Blokada doradcza sprawia,
 * że przy kilku startujących procesach migracje wykona tylko jeden. Zwraca zastosowane id.
 */
export async function migrate(db: Db): Promise<number[]> {
  const client = await db.connect();
  try {
    await client.query("select pg_advisory_lock($1)", [MIGRATION_LOCK]);
    await client.query(`
      create table if not exists schema_migrations (
        id integer primary key,
        name text not null,
        applied_at timestamptz not null default now()
      )`);
    const { rows } = await client.query<{ id: number }>("select id from schema_migrations");
    const applied = new Set(rows.map((row) => row.id));

    const done: number[] = [];
    for (const migration of MIGRATIONS) {
      if (applied.has(migration.id)) continue;
      await client.query("begin");
      try {
        await client.query(migration.sql);
        await client.query("insert into schema_migrations (id, name) values ($1, $2)", [
          migration.id,
          migration.name,
        ]);
        await client.query("commit");
      } catch (error) {
        await client.query("rollback");
        throw error;
      }
      done.push(migration.id);
    }
    return done;
  } finally {
    await client.query("select pg_advisory_unlock($1)", [MIGRATION_LOCK]).catch(() => {});
    client.release();
  }
}
