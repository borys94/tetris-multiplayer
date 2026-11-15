import { log } from '../observability/logger'
import { MIGRATIONS } from './migrations'
import type { Db } from './pool'

/** Dowolny numer blokady doradczej zarezerwowany na migracje. */
const MIGRATION_LOCK = 4_242_005

/**
 * Stosuje brakujące migracje, każdą w osobnej transakcji. Blokada doradcza sprawia,
 * że przy kilku startujących procesach migracje wykona tylko jeden. Zwraca zastosowane id.
 */
export const migrate = async (db: Db): Promise<number[]> => {
  const client = await db.connect()
  try {
    await client.query('select pg_advisory_lock($1)', [MIGRATION_LOCK])
    await client.query(`
      create table if not exists schema_migrations (
        id integer primary key,
        name text not null,
        applied_at timestamptz not null default now()
      )`)
    const { rows } = await client.query<{ id: number }>('select id from schema_migrations')
    const applied = new Set(rows.map((row) => row.id))

    const done: number[] = []
    for (const migration of MIGRATIONS) {
      if (applied.has(migration.id)) {
        continue
      }
      await client.query('begin')
      try {
        await client.query(migration.sql)
        await client.query('insert into schema_migrations (id, name) values ($1, $2)', [
          migration.id,
          migration.name,
        ])
        await client.query('commit')
      } catch (error) {
        await client.query('rollback')
        throw error
      }
      done.push(migration.id)
    }
    return done
  } finally {
    await client.query('select pg_advisory_unlock($1)', [MIGRATION_LOCK]).catch(() => {})
    client.release()
  }
}

/** Przy pierwszym deployu Postgres może startować dłużej niż serwer: ponawiamy przez ok. 2 min. */
export const migrateWhenReady = async (
  db: Db,
  attempts = 60,
  delayMs = 2000,
): Promise<number[]> => {
  for (let attempt = 1; ; attempt++) {
    try {
      return await migrate(db)
    } catch (error) {
      if (attempt >= attempts) {
        throw error
      }
      log.warn(
        { attempt, error: error instanceof Error ? error.message : String(error) },
        'database not ready, retrying in 2 s',
      )
      await new Promise((resolve) => setTimeout(resolve, delayMs))
    }
  }
}
