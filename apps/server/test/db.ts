import { randomBytes } from "node:crypto";
import pg from "pg";
import { afterAll, beforeAll, inject } from "vitest";
import { createPool, migrate, type Db } from "../src/db/pool";

/**
 * Osobna, zmigrowana baza dla pliku testowego (testy plików idą równolegle).
 * Zwraca obiekt, którego `db` jest dostępne po `beforeAll`.
 */
export function useTestDatabase(): { db: Db; url: string } {
  const context = { db: undefined as unknown as Db, url: "" };
  const name = `test_${randomBytes(6).toString("hex")}`;
  const admin = new URL(inject("postgresUrl"));

  beforeAll(async () => {
    const client = new pg.Client({ connectionString: admin.toString() });
    await client.connect();
    await client.query(`create database ${name}`);
    await client.end();

    const url = new URL(admin);
    url.pathname = `/${name}`;
    context.url = url.toString();
    context.db = createPool(context.url);
    await migrate(context.db);
  });

  afterAll(async () => {
    await context.db?.end();
    const client = new pg.Client({ connectionString: admin.toString() });
    await client.connect();
    await client.query(`drop database if exists ${name} with (force)`);
    await client.end();
  });

  return context;
}
