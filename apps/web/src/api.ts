/** Klient API serwera (spec 005). Cookie sesji wysyła przeglądarka, JS go nie widzi. */

export interface Account {
  id: number;
  username: string;
  /** `null` oznacza gracza. */
  role: "admin" | null;
}

export interface SavedGame {
  id: number;
  score: number;
  lines: number;
  level: number;
  ticks: number;
  endedAt: string;
}

export interface LeaderboardEntry {
  rank: number;
  gameId: number;
  username: string;
  score: number;
  lines: number;
  level: number;
  endedAt: string;
}

export interface AdminUser extends Account {
  disabled: boolean;
  createdAt: string;
}

export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
  ) {
    super(`${status} ${code}`);
  }
}

async function call<T>(method: string, path: string, body?: object): Promise<T> {
  const res = await fetch(`/api${path}`, {
    method,
    credentials: "same-origin",
    headers: body ? { "Content-Type": "application/json" } : {},
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  if (res.status === 204) return undefined as T;
  const data = (await res.json().catch(() => ({}))) as { error?: string };
  if (!res.ok) throw new ApiError(res.status, data.error ?? "unknown");
  return data as T;
}

export const api = {
  me: () => call<{ user: Account }>("GET", "/me").then((r) => r.user),
  register: (username: string, password: string) =>
    call<{ user: Account }>("POST", "/auth/register", { username, password }).then((r) => r.user),
  login: (username: string, password: string) =>
    call<{ user: Account }>("POST", "/auth/login", { username, password }).then((r) => r.user),
  logout: () => call<void>("POST", "/auth/logout"),
  myGames: () => call<{ games: SavedGame[] }>("GET", "/me/games").then((r) => r.games),
  leaderboard: () =>
    call<{ entries: LeaderboardEntry[] }>("GET", "/leaderboard").then((r) => r.entries),
  admin: {
    users: (query: string) =>
      call<{ users: AdminUser[] }>("GET", `/admin/users?q=${encodeURIComponent(query)}`).then(
        (r) => r.users,
      ),
    update: (id: number, changes: { role?: "admin" | null; disabled?: boolean }) =>
      call<{ user: AdminUser }>("PATCH", `/admin/users/${id}`, changes).then((r) => r.user),
    resetPassword: (id: number) =>
      call<{ password: string }>("POST", `/admin/users/${id}/password`).then((r) => r.password),
    games: (id: number) =>
      call<{ games: SavedGame[] }>("GET", `/admin/users/${id}/games`).then((r) => r.games),
    deleteGame: (id: number) => call<void>("DELETE", `/admin/games/${id}`),
  },
};

const ERROR_MESSAGES: Readonly<Record<string, string>> = {
  invalid_username: "Login: 3–20 znaków, litery, cyfry, _ lub -",
  invalid_password: "Hasło: 10–128 znaków",
  username_taken: "Ten login jest zajęty",
  invalid_credentials: "Zły login lub hasło",
  too_many_attempts: "Za dużo prób, spróbuj za 15 minut",
  account_disabled: "Konto jest zablokowane",
  cannot_change_self: "Nie możesz odebrać sobie roli ani zablokować siebie",
};

/** Komunikat błędu dla gracza. */
export function errorMessage(error: unknown): string {
  if (error instanceof ApiError) return ERROR_MESSAGES[error.code] ?? "Coś poszło nie tak";
  return "Brak połączenia z serwerem";
}

/** Data i godzina w formacie polskim. */
export function formatDate(iso: string): string {
  return new Date(iso).toLocaleString("pl-PL", { dateStyle: "short", timeStyle: "short" });
}
