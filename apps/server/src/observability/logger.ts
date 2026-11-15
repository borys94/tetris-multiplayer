import pino, { type DestinationStream, type Logger } from "pino";
import { loadLoggerConfig, type LoggerConfig } from "../config";

export type { Logger };
export type LoggerOptions = LoggerConfig;

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
export const log = createLogger(loadLoggerConfig(process.env));
