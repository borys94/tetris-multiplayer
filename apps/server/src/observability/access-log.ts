import type { RequestHandler } from "express";
import type { Logger } from "./logger";
import { httpDuration, httpRequests } from "./metrics";

/** Klasa statusu HTTP (`2xx`…`5xx`) zamiast dokładnego kodu. */
export function statusClass(status: number): string {
  return `${Math.floor(status / 100)}xx`;
}

/**
 * Trasa o małej liczności: `/api/...` z liczbami zamienionymi na `:id`, a 404 jako
 * `unmatched`, żeby losowe ścieżki nie tworzyły nowych serii. Reszta to pliki gry.
 */
export function routeLabel(path: string, status: number): string {
  if (path === "/health" || path === "/ready") return path;
  if (!path.startsWith("/api/") && path !== "/api") return "static";
  if (status === 404) return "unmatched";
  return path.replace(/\/\d+(?=\/|$)/g, "/:id");
}

/** Sondy Kubernetesa co kilka sekund zaśmiecałyby log (metryki je liczą). */
const UNLOGGED_PATHS = new Set(["/health"]);

/**
 * Log dostępu i metryki HTTP: metoda, ścieżka bez query, status i czas. Nagłówków
 * (cookie) ani body (hasła) nie logujemy wcale (spec 006, R1, R2).
 */
export function observeHttp(logger: Logger): RequestHandler {
  return (req, res, next) => {
    const path = req.originalUrl.split("?", 1)[0] ?? "/";
    const start = process.hrtime.bigint();
    res.on("finish", () => {
      const seconds = Number(process.hrtime.bigint() - start) / 1e9;
      const status = res.statusCode;
      const labels = {
        method: req.method,
        route: routeLabel(path, status),
        status: statusClass(status),
      };
      httpRequests.inc(labels);
      httpDuration.observe(labels, seconds);

      if (UNLOGGED_PATHS.has(path)) return;
      const fields = { method: req.method, path, status, ms: Math.round(seconds * 1e4) / 10 };
      if (status >= 500) logger.error(fields, "http request");
      else logger.info(fields, "http request");
    });
    next();
  };
}
