import { useCallback, useEffect, useState, type FormEvent } from "react";
import {
  MATCH_END_LABELS,
  api,
  errorMessage,
  formatDate,
  formatDuration,
  type AdminMatch,
  type AdminRoom,
} from "../api";
import styles from "../styles/views.module.scss";

/** Co ile odświeżamy pokoje i trwające mecze (spec 007: odpytywanie zamiast WebSocketu). */
export const ROOMS_REFRESH_MS = 3000;
/** Rozmiar strony meczów z serwera; pełna strona oznacza, że mogą być starsze. */
const PAGE_SIZE = 50;

const ROOM_STATES: Readonly<Record<AdminRoom["state"], string>> = {
  waiting: "czeka",
  countdown: "odliczanie",
  playing: "mecz trwa",
  finished: "po meczu",
};

function seconds(total: number): string {
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, "0")}`;
}

/** Wszystkie otwarte pokoje i trwające mecze, odświeżane co kilka sekund (R5). */
export function RoomsPanel({ active }: { active: boolean }) {
  const [rooms, setRooms] = useState<AdminRoom[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!active) return;
    let cancelled = false;
    const load = () =>
      api.admin.rooms().then(
        (list) => {
          if (cancelled) return;
          setRooms(list);
          setError(null);
        },
        (err: unknown) => !cancelled && setError(errorMessage(err)),
      );
    void load();
    const timer = window.setInterval(() => void load(), ROOMS_REFRESH_MS);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [active]);

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
                    <td className={styles.number}>{seconds(room.match!.seconds)}</td>
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

/** Wszystkie zakończone mecze 1v1 z wyszukiwaniem po graczu i stronicowaniem (R5). */
export function MatchesPanel({ active }: { active: boolean }) {
  const [query, setQuery] = useState("");
  const [matches, setMatches] = useState<AdminMatch[] | null>(null);
  const [more, setMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (q: string, before?: number) => {
    try {
      const page = await api.admin.matches(q, before);
      setMatches((list) => (before ? [...(list ?? []), ...page] : page));
      setMore(page.length === PAGE_SIZE);
      setError(null);
    } catch (err) {
      setError(errorMessage(err));
    }
  }, []);

  useEffect(() => {
    if (!active) return;
    let cancelled = false;
    api.admin.matches("").then(
      (page) => {
        if (cancelled) return;
        setMatches(page);
        setMore(page.length === PAGE_SIZE);
      },
      (err: unknown) => !cancelled && setError(errorMessage(err)),
    );
    return () => {
      cancelled = true;
    };
  }, [active]);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    void load(query);
  };

  return (
    <section className={styles.card}>
      <h2>Mecze 1v1</h2>
      <form className={styles.row} onSubmit={submit} role="search">
        <label className={styles.field}>
          Gracz
          <input value={query} onChange={(event) => setQuery(event.target.value)} />
        </label>
        <button className={styles.button} type="submit">
          Szukaj
        </button>
      </form>
      {error && <p className={styles.error}>{error}</p>}
      {matches?.length === 0 && <p className={styles.muted}>Brak meczów.</p>}
      {matches && matches.length > 0 && (
        <div className={styles.tableWrap}>
          <table className={styles.table} aria-label="Wyniki meczów">
            <thead>
              <tr>
                <th>Data</th>
                <th>Zwycięzca</th>
                <th>Przegrany</th>
                <th>Powód</th>
                <th className={styles.number}>Linie</th>
                <th className={styles.number}>Czas</th>
              </tr>
            </thead>
            <tbody>
              {matches.map((match) => (
                <tr key={match.id}>
                  <td>{formatDate(match.endedAt)}</td>
                  <td>{match.winnerName}</td>
                  <td>{match.loserName}</td>
                  <td>{MATCH_END_LABELS[match.reason]}</td>
                  <td className={styles.number}>
                    {match.winnerLinesSent} : {match.loserLinesSent}
                  </td>
                  <td className={styles.number}>{formatDuration(match.ticks)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {more && matches && (
        <button
          className={styles.secondary}
          onClick={() => void load(query, matches[matches.length - 1]!.id)}
        >
          Starsze
        </button>
      )}
    </section>
  );
}
