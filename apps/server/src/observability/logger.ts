import pino, { type DestinationStream, type Logger } from "pino";

export type { Logger };

export interface LoggerOptions {
  /** Środowisko (`beta`, `prod`, `dev`) w każdej linii logu. */
  env: string;
  /** Wersja aplikacji (SHA commita) w każdej linii logu. */
  version: string;
  level: string;
}

/**
 * Pola, które nigdy nie trafiają do logu (spec 006, R2): cookie sesji, hasła i tokeny,
 * także gdy ktoś zaloguje cały obiekt żądania albo body.
 */
export const REDACT_PATHS = [
  "password",
  "*.password",
  "newPassword",
  "*.newPassword",
  "token",
  "*.token",
  "cookie",
  "*.cookie",
  "headers.cookie",
  "*.headers.cookie",
  'headers["set-cookie"]',
  '*.headers["set-cookie"]',
];

/** Logger JSON: jedna linia na zdarzenie z `level`, `time`, `msg`, `env` i `version`. */
export function createLogger(options: LoggerOptions, destination?: DestinationStream): Logger {
  return pino(
    {
      level: options.level,
      base: { env: options.env, version: options.version },
      timestamp: pino.stdTimeFunctions.isoTime,
      formatters: { level: (label) => ({ level: label }) },
      redact: { paths: REDACT_PATHS, censor: "[redacted]" },
    },
    destination,
  );
}

/** Logger procesu skonfigurowany ze zmiennych środowiskowych; w testach domyślnie cichy. */
export const log = createLogger({
  env: process.env.APP_ENV ?? "dev",
  version: process.env.APP_VERSION ?? "dev",
  level: process.env.LOG_LEVEL ?? (process.env.VITEST ? "silent" : "info"),
});
