import type { RequestHandler } from "express";
import type { Logger } from "./logger";

/** Sondy Kubernetesa co kilka sekund zaśmiecałyby log. */
const SKIPPED_PATHS = new Set(["/health"]);

/**
 * Log dostępu HTTP: metoda, ścieżka bez query, status i czas. Nagłówków (cookie)
 * ani body (hasła) nie logujemy wcale (spec 006, R2).
 */
export function accessLog(logger: Logger): RequestHandler {
  return (req, res, next) => {
    const path = req.originalUrl.split("?", 1)[0] ?? "/";
    if (SKIPPED_PATHS.has(path)) return next();
    const start = process.hrtime.bigint();
    res.on("finish", () => {
      const ms = Number(process.hrtime.bigint() - start) / 1e6;
      const fields = {
        method: req.method,
        path,
        status: res.statusCode,
        ms: Math.round(ms * 10) / 10,
      };
      if (res.statusCode >= 500) logger.error(fields, "http request");
      else logger.info(fields, "http request");
    });
    next();
  };
}
