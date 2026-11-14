import pg from "pg";
import { log } from "../observability/logger";

export type Db = pg.Pool;

/** Pula albo połączenie w transakcji: funkcje repozytoriów działają na obu. */
export type Queryable = Pick<pg.Pool, "query">;

/** Najwięcej wierszy w listach (historia gier i meczów, ranking, wyszukiwanie kont). */
export const LIST_LIMIT = 50;

// Identyfikatory to bigint; przy naszej skali mieszczą się w number, więc nie zwracamy stringów.
pg.types.setTypeParser(pg.types.builtins.INT8, Number);

/** Pula połączeń; mała, bo serwer, baza i monitoring dzielą jeden mały węzeł (ADR-0008, ADR-0009). */
export function createPool(connectionString: string, applicationName = "blockfall"): Db {
  const pool = new pg.Pool({
    connectionString,
    max: 5,
    idleTimeoutMillis: 30_000,
    application_name: applicationName,
  });
  // Bez tej obsługi zamknięcie bezczynnego połączenia przez bazę (np. restart Postgresa)
  // to nieobsłużone zdarzenie `error`, które kończy cały proces, a z nim trwające gry.
  // Pula sama odrzuca takie połączenie i przy następnym zapytaniu otwiera nowe.
  pool.on("error", (error) => log.warn({ err: error }, "idle database connection lost"));
  return pool;
}

/** Wykonuje `work` w jednej transakcji: błąd wycofuje wszystkie zmiany. */
export async function transaction<T>(db: Db, work: (tx: Queryable) => Promise<T>): Promise<T> {
  const client = await db.connect();
  try {
    await client.query("begin");
    const result = await work(client);
    await client.query("commit");
    return result;
  } catch (error) {
    await client.query("rollback");
    throw error;
  } finally {
    client.release();
  }
}
