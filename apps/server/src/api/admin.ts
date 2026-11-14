import { Router, type Request, type Response } from "express";
import { hashPassword, temporaryPassword } from "../auth/passwords";
import { deleteGame, userGames } from "../db/games";
import type { Db } from "../db/pool";
import { deleteUserSessions } from "../db/sessions";
import {
  findUserById,
  searchUsers,
  setDisabled,
  setPasswordHash,
  setRole,
  type Role,
} from "../db/users";
import { requireAdmin } from "./middleware";

const MAX_QUERY = 20;

/** Id z parametru ścieżki albo `null` (wtedy odpowiadamy 400). */
function idParam(req: Request, res: Response): number | null {
  const id = Number(req.params.id);
  if (Number.isSafeInteger(id) && id > 0) return id;
  res.status(400).json({ error: "invalid" });
  return null;
}

interface UserChanges {
  role?: Role | null;
  disabled?: boolean;
}

function readChanges(body: unknown): UserChanges | null {
  if (typeof body !== "object" || body === null) return null;
  const { role, disabled } = body as Record<string, unknown>;
  const changes: UserChanges = {};
  if (role !== undefined) {
    if (role !== "admin" && role !== null) return null;
    changes.role = role;
  }
  if (disabled !== undefined) {
    if (typeof disabled !== "boolean") return null;
    changes.disabled = disabled;
  }
  return Object.keys(changes).length > 0 ? changes : null;
}

/** Panel admina (R4); dostęp tylko z rolą `admin`, sprawdzaną na serwerze. */
export function adminRouter(db: Db): Router {
  const router = Router();
  router.use(requireAdmin);

  router.get("/users", async (req, res) => {
    const query = typeof req.query.q === "string" ? req.query.q.trim().toLowerCase() : "";
    res.json({ users: await searchUsers(db, query.slice(0, MAX_QUERY)) });
  });

  router.patch("/users/:id", async (req, res) => {
    const id = idParam(req, res);
    if (id === null) return;
    const changes = readChanges(req.body);
    if (!changes) {
      res.status(400).json({ error: "invalid" });
      return;
    }
    // Admin nie może odebrać sobie roli ani zablokować siebie (spec 005, R4).
    if (id === res.locals.user!.id && (changes.role === null || changes.disabled === true)) {
      res.status(400).json({ error: "cannot_change_self" });
      return;
    }
    if (!(await findUserById(db, id))) {
      res.status(404).json({ error: "not_found" });
      return;
    }
    if (changes.role !== undefined) await setRole(db, id, changes.role);
    if (changes.disabled !== undefined) await setDisabled(db, id, changes.disabled);
    res.json({ user: await findUserById(db, id) });
  });

  router.post("/users/:id/password", async (req, res) => {
    const id = idParam(req, res);
    if (id === null) return;
    const password = temporaryPassword();
    if (!(await setPasswordHash(db, id, await hashPassword(password)))) {
      res.status(404).json({ error: "not_found" });
      return;
    }
    // Stare hasło mogło wyciec: wylogowujemy konto ze wszystkich urządzeń.
    await deleteUserSessions(db, id);
    // Hasło tymczasowe pokazujemy adminowi tylko w tej odpowiedzi; nie trafia do logów.
    res.json({ password });
  });

  router.get("/users/:id/games", async (req, res) => {
    const id = idParam(req, res);
    if (id === null) return;
    res.json({ games: await userGames(db, id) });
  });

  router.delete("/games/:id", async (req, res) => {
    const id = idParam(req, res);
    if (id === null) return;
    if (!(await deleteGame(db, id))) {
      res.status(404).json({ error: "not_found" });
      return;
    }
    res.status(204).end();
  });

  return router;
}
