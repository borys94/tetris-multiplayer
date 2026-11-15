import type { RoomState } from "@tetris/protocol";
import { api } from "../../api/client";
import { useApiData } from "../hooks/use-api-data";
import { formatClock, formatDate } from "../../format";
import styles from "../ui/views.module.scss";

/** Co ile odświeżamy pokoje i trwające mecze (spec 007: odpytywanie zamiast WebSocketu). */
export const ROOMS_REFRESH_MS = 3000;

const ROOM_STATES: Readonly<Record<RoomState, string>> = {
  waiting: "czeka",
  countdown: "odliczanie",
  playing: "mecz trwa",
  finished: "po meczu",
};

/** Wszystkie otwarte pokoje i trwające mecze, odświeżane co kilka sekund (R5). */
export function RoomsPanel({ active }: { active: boolean }) {
  const { data: rooms, error } = useApiData(api.admin.rooms, {
    enabled: active,
    refreshMs: ROOMS_REFRESH_MS,
  });

  const playing = rooms?.filter((room) => room.match) ?? [];

  return (
    <>
      <section className={styles.card}>
        <h2>Trwające mecze</h2>
        {error && <p className={styles.error}>{error}</p>}
        {rooms && playing.length === 0 && <p className={styles.muted}>Żaden mecz nie trwa.</p>}
        {playing.length > 0 && (
          <div className={styles.tableWrap}>
            <table className={styles.table} aria-label="Trwające mecze">
              <thead>
                <tr>
                  <th>Pokój</th>
                  <th>Gracze</th>
                  <th className={styles.number}>Czas</th>
                  <th className={styles.number}>Wysłane linie</th>
                </tr>
              </thead>
              <tbody>
                {playing.map((room) => (
                  <tr key={room.code}>
                    <td>{room.code}</td>
                    <td>{room.match!.players.map((p) => p.name).join(" vs ")}</td>
                    <td className={styles.number}>{formatClock(room.match!.seconds)}</td>
                    <td className={styles.number}>
                      {room.match!.players.map((p) => p.linesSent).join(" : ")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className={styles.card}>
        <h2>Otwarte pokoje</h2>
        {rooms?.length === 0 && <p className={styles.muted}>Brak otwartych pokoi.</p>}
        {rooms && rooms.length > 0 && (
          <div className={styles.tableWrap}>
            <table className={styles.table} aria-label="Pokoje">
              <thead>
                <tr>
                  <th>Kod</th>
                  <th>Typ</th>
                  <th>Stan</th>
                  <th>Gracze</th>
                  <th>Otwarty</th>
                </tr>
              </thead>
              <tbody>
                {rooms.map((room) => (
                  <tr key={room.code}>
                    <td>
                      <code className={styles.secret}>{room.code}</code>
                    </td>
                    <td>{room.visibility === "private" ? "prywatny" : "publiczny"}</td>
                    <td>{ROOM_STATES[room.state]}</td>
                    <td>
                      {room.players
                        .map((p) => `${p.name}${p.connected ? "" : " (rozłączony)"}`)
                        .join(", ")}
                    </td>
                    <td>{formatDate(new Date(room.createdAt).toISOString())}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}
