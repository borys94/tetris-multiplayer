import type { Db } from "./db/pool";
import { findUserByUsername, setRole } from "./db/users";

/**
 * Komendy administracyjne uruchamiane w podzie przez SSM (runbook):
 * `node main.cjs promote <login>` nadaje rolę admina (pierwszy admin, spec 005).
 * Zwraca kod wyjścia procesu.
 */
export async function runCli(db: Db, args: readonly string[]): Promise<number> {
  const [command, username] = args;
  if (command !== "promote" || !username) {
    console.error("Użycie: node main.cjs promote <login>");
    return 2;
  }
  const user = await findUserByUsername(db, username.toLowerCase());
  if (!user) {
    console.error(`Nie ma konta ${username}`);
    return 1;
  }
  await setRole(db, user.id, "admin");
  console.log(`${user.username} ma teraz rolę admin`);
  return 0;
}
