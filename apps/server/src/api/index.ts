import express, { Router } from "express";
import { LoginLimiter } from "../auth/login-limiter";
import type { Db } from "../db/pool";
import { adminRouter } from "./admin";
import { authRouter, meRouter } from "./auth";
import { handleErrors, loadUser, protectMutations } from "./middleware";
import { scoresRouter } from "./scores";

export interface ApiOptions {
  db: Db;
  /** Dozwolony `Origin` dla zmian stanu; bez niego (dev) nie sprawdzamy. */
  allowedOrigin?: string;
  secureCookies: boolean;
  limiter?: LoginLimiter;
}

/** API pod `/api` (spec 005). */
export function createApi({
  db,
  allowedOrigin,
  secureCookies,
  limiter = new LoginLimiter(),
}: ApiOptions): Router {
  const api = Router();
  api.use(protectMutations(allowedOrigin));
  api.use(express.json({ limit: "4kb" }));
  api.use(loadUser(db));

  api.use("/auth", authRouter({ db, limiter, secureCookies }));
  api.use(scoresRouter(db));
  api.use("/me", meRouter(secureCookies));
  api.use("/admin", adminRouter(db));

  api.use((_req, res) => {
    res.status(404).json({ error: "not_found" });
  });
  api.use(handleErrors);
  return api;
}
