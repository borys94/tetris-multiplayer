import { TICKS_PER_SECOND } from "@tetris/game-core";

export interface Config {
  port: number;
  version: string;
  staticDir?: string;
  allowedOrigin?: string;
  trustProxy: boolean;
  /** Bufor wejścia w tickach (ADR-0006), liczony z `INPUT_BUFFER_MS`. */
  bufferTicks: number;
  maxSessions: number;
  sessionTtlMs: number;
  maxConnectionsPerIp: number;
}

/** Domyślny bufor wejścia; do rewizji po M6 na podstawie rozkładu RTT (ADR-0006). */
export const DEFAULT_INPUT_BUFFER_MS = 150;

function positiveInt(env: NodeJS.ProcessEnv, name: string, fallback: number): number {
  const raw = env[name];
  if (raw === undefined || raw === "") return fallback;
  const value = Number(raw);
  if (!Number.isInteger(value) || value < 0) {
    throw new Error(`${name} musi być nieujemną liczbą całkowitą, jest: ${raw}`);
  }
  return value;
}

export function loadConfig(env: NodeJS.ProcessEnv): Config {
  const bufferMs = positiveInt(env, "INPUT_BUFFER_MS", DEFAULT_INPUT_BUFFER_MS);
  return {
    port: positiveInt(env, "PORT", 3000),
    version: env.APP_VERSION ?? "dev",
    ...(env.STATIC_DIR ? { staticDir: env.STATIC_DIR } : {}),
    ...(env.ALLOWED_ORIGIN ? { allowedOrigin: env.ALLOWED_ORIGIN } : {}),
    trustProxy: env.TRUST_PROXY === "true",
    bufferTicks: Math.round((bufferMs / 1000) * TICKS_PER_SECOND),
    maxSessions: positiveInt(env, "MAX_SESSIONS", 200),
    sessionTtlMs: positiveInt(env, "SESSION_TTL_MS", 60_000),
    maxConnectionsPerIp: positiveInt(env, "MAX_CONNECTIONS_PER_IP", 5),
  };
}
