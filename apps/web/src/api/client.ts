import type {
  Account,
  AdminMatch,
  AdminRoom,
  AdminUser,
  LeaderboardEntry,
  PlayerMatch,
  SavedGame,
  UserChanges,
} from "./types";

/** Odpowiedź API z kodem błędu (`{ error }`) albo statusem bez treści. */
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

/** Klient API serwera (spec 005, 007). Cookie sesji wysyła przeglądarka, JS go nie widzi. */
export const api = {
  me: () => call<{ user: Account }>("GET", "/me").then((r) => r.user),
  register: (username: string, password: string) =>
    call<{ user: Account }>("POST", "/auth/register", { username, password }).then((r) => r.user),
  login: (username: string, password: string) =>
    call<{ user: Account }>("POST", "/auth/login", { username, password }).then((r) => r.user),
  logout: () => call<void>("POST", "/auth/logout"),
  myGames: () => call<{ games: SavedGame[] }>("GET", "/me/games").then((r) => r.games),
  myMatches: () => call<{ matches: PlayerMatch[] }>("GET", "/me/matches").then((r) => r.matches),
  leaderboard: () =>
    call<{ entries: LeaderboardEntry[] }>("GET", "/leaderboard").then((r) => r.entries),
  admin: {
    users: (query: string) =>
      call<{ users: AdminUser[] }>("GET", `/admin/users?q=${encodeURIComponent(query)}`).then(
        (r) => r.users,
      ),
    update: (id: number, changes: UserChanges) =>
      call<{ user: AdminUser }>("PATCH", `/admin/users/${id}`, changes).then((r) => r.user),
    resetPassword: (id: number) =>
      call<{ password: string }>("POST", `/admin/users/${id}/password`).then((r) => r.password),
    games: (id: number) =>
      call<{ games: SavedGame[] }>("GET", `/admin/users/${id}/games`).then((r) => r.games),
    deleteGame: (id: number) => call<void>("DELETE", `/admin/games/${id}`),
    rooms: () => call<{ rooms: AdminRoom[] }>("GET", "/admin/rooms").then((r) => r.rooms),
    matches: (query: string, before?: number) =>
      call<{ matches: AdminMatch[] }>(
        "GET",
        `/admin/matches?q=${encodeURIComponent(query)}${before ? `&before=${before}` : ""}`,
      ).then((r) => r.matches),
  },
};
