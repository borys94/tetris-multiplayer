import express, { type Express, type Router } from "express";
import { observeHttp } from "./observability/access-log";
import { log, type Logger } from "./observability/logger";

export interface AppOptions {
  /** Wersja aplikacji (SHA commita) zwracana w `/health`. */
  version: string;
  /** Katalog ze zbudowanym frontendem; bez niego serwer nie serwuje plików statycznych. */
  staticDir?: string;
  /** API pod `/api` (konta, ranking, admin); bez niego serwer serwuje tylko grę. */
  api?: Router;
  /** Logger dla logu dostępu; domyślnie logger procesu. */
  logger?: Logger;
}

export function createApp({ version, staticDir, api, logger = log }: AppOptions): Express {
  const app = express();
  app.disable("x-powered-by");
  app.use(observeHttp(logger));

  app.get("/health", (_req, res) => {
    res.json({ status: "ok", version });
  });

  if (api) app.use("/api", api);

  if (staticDir) {
    app.use(express.static(staticDir, { index: "index.html", maxAge: "1h" }));
  }

  return app;
}
