import { vi } from "vitest";

type Handler = (body: unknown) => [status: number, body?: unknown];

/**
 * Atrapa `fetch` dla `/api`: klucz to "METODA /ścieżka" (bez `/api`), np. "GET /me".
 * Zwraca listę wywołań do sprawdzenia w teście.
 */
export function fakeApi(routes: Record<string, Handler>) {
  const calls: { key: string; body: unknown }[] = [];
  vi.stubGlobal(
    "fetch",
    vi.fn((input: string, init: RequestInit = {}) => {
      const key = `${init.method ?? "GET"} ${input.replace(/^\/api/, "")}`;
      const body: unknown = typeof init.body === "string" ? JSON.parse(init.body) : undefined;
      calls.push({ key, body });
      const [status, json] = routes[key]?.(body) ?? [404, { error: "not_found" }];
      return Promise.resolve(
        new Response(status === 204 ? null : JSON.stringify(json ?? {}), {
          status,
          headers: { "Content-Type": "application/json" },
        }),
      );
    }),
  );
  return calls;
}

export const GUEST = { "GET /me": () => [401, { error: "unauthenticated" }] } satisfies Record<
  string,
  Handler
>;
