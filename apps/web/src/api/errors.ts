import { ApiError } from "./client";

const ERROR_MESSAGES: Readonly<Record<string, string>> = {
  invalid_username: "Login: 3–20 znaków, litery, cyfry, _ lub -",
  invalid_password: "Hasło: 10–128 znaków",
  username_taken: "Ten login jest zajęty",
  invalid_credentials: "Zły login lub hasło",
  too_many_attempts: "Za dużo prób, spróbuj za 15 minut",
  account_disabled: "Konto jest zablokowane",
  cannot_change_self: "Nie możesz odebrać sobie roli ani zablokować siebie",
};

/** Komunikat błędu API dla gracza. */
export function errorMessage(error: unknown): string {
  if (error instanceof ApiError) return ERROR_MESSAGES[error.code] ?? "Coś poszło nie tak";
  return "Brak połączenia z serwerem";
}
