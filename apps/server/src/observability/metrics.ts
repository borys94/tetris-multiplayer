import { createServer, type Server } from "node:http";
import { Counter, Gauge, Histogram, Registry, collectDefaultMetrics } from "prom-client";

/**
 * Metryki Prometheusa serwera (spec 006, R1). Jeden rejestr na proces z prefiksem
 * `blockfall_`. Etykiety mają małą liczność: bez loginów, id i surowych URL-i.
 */
export const registry = new Registry();
collectDefaultMetrics({ register: registry, prefix: "blockfall_" });

const registers = [registry];

export const httpRequests = new Counter({
  name: "blockfall_http_requests_total",
  help: "Żądania HTTP według metody, trasy i klasy statusu",
  labelNames: ["method", "route", "status"] as const,
  registers,
});

export const httpDuration = new Histogram({
  name: "blockfall_http_request_duration_seconds",
  help: "Czas obsługi żądań HTTP",
  labelNames: ["method", "route", "status"] as const,
  buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5],
  registers,
});

export const wsConnections = new Gauge({
  name: "blockfall_ws_connections",
  help: "Otwarte połączenia WebSocket",
  registers,
});

export const wsRejected = new Counter({
  name: "blockfall_ws_rejected_total",
  help: "Odrzucone próby połączenia WebSocket według powodu",
  labelNames: ["reason"] as const,
  registers,
});

export const wsMessages = new Counter({
  name: "blockfall_ws_messages_total",
  help: "Odebrane wiadomości WebSocket",
  registers,
});

export const wsErrors = new Counter({
  name: "blockfall_ws_errors_total",
  help: "Odrzucone wiadomości WebSocket według kodu błędu",
  labelNames: ["code"] as const,
  registers,
});

export const gamesStarted = new Counter({
  name: "blockfall_games_started_total",
  help: "Rozpoczęte gry",
  registers,
});

export const gamesFinished = new Counter({
  name: "blockfall_games_finished_total",
  help: "Zakończone gry (game over) według typu gracza",
  labelNames: ["player"] as const,
  registers,
});

export const gameSaveErrors = new Counter({
  name: "blockfall_game_save_errors_total",
  help: "Nieudane zapisy wyniku gry w bazie",
  registers,
});

export const serverFull = new Counter({
  name: "blockfall_server_full_total",
  help: "Odmowy nowej sesji z powodu limitu sesji",
  registers,
});

/** Budżet ticka to 16,7 ms (60 ticków/s); kubełki gęste poniżej budżetu. */
export const tickDuration = new Histogram({
  name: "blockfall_tick_duration_seconds",
  help: "Czas jednego obiegu pętli gry (wszystkie sesje)",
  buckets: [0.0005, 0.001, 0.002, 0.004, 0.008, 0.0167, 0.033, 0.1],
  registers,
});

export const ticksDropped = new Counter({
  name: "blockfall_ticks_dropped_total",
  help: "Ticki pominięte, bo pętla zdarzeń nie nadążała",
  registers,
});

/** Część obiegu pętli przypadająca na pokoje 1v1 (spec 007); całość mierzy `tickDuration`. */
export const roomTickDuration = new Histogram({
  name: "blockfall_room_tick_seconds",
  help: "Czas przesunięcia wszystkich pokoi w jednym obiegu pętli gry",
  buckets: [0.0005, 0.001, 0.002, 0.004, 0.008, 0.0167, 0.033, 0.1],
  registers,
});

export const matchesFinished = new Counter({
  name: "blockfall_matches_finished_total",
  help: "Zakończone mecze 1v1 według powodu przegranej",
  labelNames: ["reason"] as const,
  registers,
});

export const garbageLines = new Counter({
  name: "blockfall_garbage_lines_total",
  help: "Linie śmieci wysłane przeciwnikom w meczach 1v1",
  registers,
});

export const wsSentBytes = new Counter({
  name: "blockfall_ws_sent_bytes_total",
  help: "Bajty wysłane przez WebSocket według typu wiadomości",
  labelNames: ["type"] as const,
  registers,
});

export const logins = new Counter({
  name: "blockfall_logins_total",
  help: "Próby logowania według wyniku",
  labelNames: ["result"] as const,
  registers,
});

export const registrations = new Counter({
  name: "blockfall_registrations_total",
  help: "Założone konta",
  registers,
});

/**
 * Serie z etykietami powstają przy pierwszym `inc`, więc Prometheus nie widzi ich
 * wartości 0 i `increase()` gubi pierwsze zdarzenie (np. pierwszą grę po starcie).
 * Znane wartości etykiet zakładamy od razu z zerem.
 */
for (const player of ["guest", "user"]) gamesFinished.inc({ player }, 0);
for (const result of ["success", "failure", "locked", "disabled"]) logins.inc({ result }, 0);
for (const code of ["invalid", "rate_limited"]) wsErrors.inc({ code }, 0);
for (const reason of ["origin", "ip_limit", "draining"]) wsRejected.inc({ reason }, 0);
for (const reason of ["topout", "left", "timeout"]) matchesFinished.inc({ reason }, 0);

/** Liczniki, których wartość odczytujemy w chwili zbierania metryk. */
export function trackGauge(name: string, help: string, read: () => number): void {
  registry.removeSingleMetric(name);
  new Gauge({
    name,
    help,
    registers,
    collect() {
      this.set(read());
    },
  });
}

/** Liczba pokoi 1v1 według stanu i widoczności (spec 007), odczytywana przy zbieraniu metryk. */
export function trackRooms(
  read: () => { state: string; visibility: string; count: number }[],
): void {
  const name = "blockfall_rooms";
  registry.removeSingleMetric(name);
  new Gauge({
    name,
    help: "Otwarte pokoje 1v1 według stanu i widoczności",
    labelNames: ["state", "visibility"] as const,
    registers,
    collect() {
      for (const { state, visibility, count } of read()) this.set({ state, visibility }, count);
    },
  });
}

export interface PoolStats {
  totalCount: number;
  idleCount: number;
  waitingCount: number;
}

/** Stan puli `pg`: wszystkie, bezczynne i oczekujące na połączenie. */
export function trackPool(pool: PoolStats): void {
  const name = "blockfall_db_pool_connections";
  registry.removeSingleMetric(name);
  new Gauge({
    name,
    help: "Połączenia puli Postgresa według stanu",
    labelNames: ["state"] as const,
    registers,
    collect() {
      this.set({ state: "total" }, pool.totalCount);
      this.set({ state: "idle" }, pool.idleCount);
      this.set({ state: "waiting" }, pool.waitingCount);
    },
  });
}

/** Klasa statusu HTTP (`2xx`…`5xx`) zamiast dokładnego kodu. */
export function statusClass(status: number): string {
  return `${Math.floor(status / 100)}xx`;
}

/**
 * Trasa o małej liczności: `/api/...` z liczbami zamienionymi na `:id`, a 404 jako
 * `unmatched`, żeby losowe ścieżki nie tworzyły nowych serii. Reszta to pliki gry.
 */
export function routeLabel(path: string, status: number): string {
  if (path === "/health" || path === "/ready") return path;
  if (!path.startsWith("/api/") && path !== "/api") return "static";
  if (status === 404) return "unmatched";
  return path.replace(/\/\d+(?=\/|$)/g, "/:id");
}

/**
 * Osobny serwer HTTP tylko z `/metrics` (port 9464). Service i ingress aplikacji go
 * nie wystawiają, więc metryki nie są dostępne z internetu (spec 006).
 */
export function createMetricsServer(): Server {
  return createServer((req, res) => {
    if (req.method !== "GET" || req.url !== "/metrics") {
      res.writeHead(404).end();
      return;
    }
    registry.metrics().then(
      (body) => {
        res.writeHead(200, { "Content-Type": registry.contentType }).end(body);
      },
      () => {
        res.writeHead(500).end();
      },
    );
  });
}
