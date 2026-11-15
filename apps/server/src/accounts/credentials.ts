/** Login: małe litery, cyfry, `_` i `-` (ten sam wzorzec pilnuje `check` w tabeli `users`). */
export const USERNAME_PATTERN = /^[a-z0-9_-]{3,20}$/;
export const PASSWORD_MIN = 10;
export const PASSWORD_MAX = 128;

/** Login zapisujemy małymi literami, więc unikalność nie zależy od wielkości liter. */
export function normalizeUsername(username: string): string {
  return username.trim().toLowerCase();
}

export function validUsername(username: string): boolean {
  return USERNAME_PATTERN.test(username);
}

export function validPassword(password: string): boolean {
  return password.length >= PASSWORD_MIN && password.length <= PASSWORD_MAX;
}
