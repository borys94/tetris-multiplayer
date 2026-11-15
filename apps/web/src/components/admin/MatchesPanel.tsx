import { useCallback, useState, type FormEvent } from "react";
import { api } from "../../api/client";
import { errorMessage } from "../../api/errors";
import { PAGE_SIZE } from "../../api/types";
import { useApiData } from "../hooks/use-api-data";
import { MATCH_END_LABELS, formatDate, formatDuration } from "../../format";
import styles from "../ui/views.module.scss";

/** Wszystkie zakończone mecze 1v1 z wyszukiwaniem po graczu i stronicowaniem (R5). */
export function MatchesPanel({ active }: { active: boolean }) {
  const [query, setQuery] = useState("");
  // Pierwsza strona przy wejściu; wyszukiwanie i „Starsze” podmieniają lub dokładają strony.
  const {
    data: matches,
    error,
    setData: setMatches,
    setError,
  } = useApiData(() => api.admin.matches(""), { enabled: active });
  // Doczytujemy tylko po pełnej stronie, więc lista z samych pełnych stron może mieć starsze mecze.
  const more = matches !== null && matches.length > 0 && matches.length % PAGE_SIZE === 0;

  const load = useCallback(
    async (q: string, before?: number) => {
      try {
        const page = await api.admin.matches(q, before);
        setMatches((list) => (before ? [...(list ?? []), ...page] : page));
        setError(null);
      } catch (err) {
        setError(errorMessage(err));
      }
    },
    [setMatches, setError],
  );

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
