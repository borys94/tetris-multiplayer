import { randomBytes } from "node:crypto";

/** Losowy seed gry (32 bity). */
export function randomSeed(): number {
  return randomBytes(4).readUInt32LE();
}

/** Losowy, nieprzewidywalny identyfikator (128 bitów, base64url). */
export function randomId(): string {
  return randomBytes(16).toString("base64url");
}
