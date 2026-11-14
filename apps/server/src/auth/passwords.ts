import {
  randomBytes,
  scrypt as scryptCallback,
  timingSafeEqual,
  type ScryptOptions,
} from "node:crypto";

const N = 2 ** 15;
const R = 8;
const P = 1;
const KEY_LENGTH = 32;
/** scrypt potrzebuje 128·N·r bajtów (32 MB); limit musi to przekraczać. */
const MAX_MEMORY = 64 * 1024 * 1024;
/** Tyle hashowań naraz, żeby zmieścić się w limicie pamięci poda (192 Mi). */
const MAX_CONCURRENT = 2;

export const USERNAME_PATTERN = /^[a-z0-9_-]{3,20}$/;
export const PASSWORD_MIN = 10;
export const PASSWORD_MAX = 128;

function scrypt(password: string, salt: Buffer, options: ScryptOptions): Promise<Buffer> {
  return new Promise((resolve, reject) =>
    scryptCallback(password, salt, KEY_LENGTH, options, (error, key) =>
      error ? reject(error) : resolve(key),
    ),
  );
}

let running = 0;
const waiting: (() => void)[] = [];

/** Kolejkuje hashowanie, gdy trwa już MAX_CONCURRENT. */
async function limited<T>(task: () => Promise<T>): Promise<T> {
  if (running >= MAX_CONCURRENT) await new Promise<void>((resolve) => waiting.push(resolve));
  running++;
  try {
    return await task();
  } finally {
    running--;
    waiting.shift()?.();
  }
}

/** Hash w formacie `scrypt$N$r$p$sól$klucz` (base64), z parametrami do przyszłej zmiany. */
export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const key = await limited(() => scrypt(password, salt, { N, r: R, p: P, maxmem: MAX_MEMORY }));
  return ["scrypt", N, R, P, salt.toString("base64"), key.toString("base64")].join("$");
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [algorithm, n, r, p, salt, key] = stored.split("$");
  if (algorithm !== "scrypt" || !salt || !key) return false;
  const expected = Buffer.from(key, "base64");
  const actual = await limited(() =>
    scrypt(password, Buffer.from(salt, "base64"), {
      N: Number(n),
      r: Number(r),
      p: Number(p),
      maxmem: MAX_MEMORY,
    }),
  );
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

let dummy: Promise<string> | null = null;

/** Hash do porównania, gdy loginu nie ma: odpowiedź trwa tyle samo co dla istniejącego konta. */
export function dummyHash(): Promise<string> {
  dummy ??= hashPassword(randomBytes(16).toString("hex"));
  return dummy;
}

/** Losowe hasło tymczasowe ustawiane przez admina (16 znaków). */
export function temporaryPassword(): string {
  return randomBytes(12).toString("base64url");
}
