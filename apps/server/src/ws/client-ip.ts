import type { IncomingMessage } from "node:http";

/** Adres klienta; za Traefikiem (`trustProxy`) z `X-Forwarded-For`. */
export function clientIp(req: IncomingMessage, trustProxy: boolean): string {
  const forwarded = req.headers["x-forwarded-for"];
  if (trustProxy && typeof forwarded === "string") {
    // Traefik dopisuje adres klienta na końcu listy; wcześniejsze wpisy może podać sam klient.
    const last = forwarded.split(",").at(-1)?.trim();
    if (last) return last;
  }
  return req.socket.remoteAddress ?? "unknown";
}
