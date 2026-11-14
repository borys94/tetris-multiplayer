import express, { type Express } from "express";

export interface AppOptions {
  /** Wersja aplikacji (SHA commita) zwracana w `/health`. */
  version: string;
  /** Katalog ze zbudowanym frontendem; bez niego serwer nie serwuje plików statycznych. */
  staticDir?: string;
}

export function createApp({ version, staticDir }: AppOptions): Express {
  const app = express();
  app.disable("x-powered-by");

  app.get("/health", (_req, res) => {
    res.json({ status: "ok", version });
  });

  if (staticDir) {
    app.use(express.static(staticDir, { index: "index.html", maxAge: "1h" }));
  }

  return app;
}
