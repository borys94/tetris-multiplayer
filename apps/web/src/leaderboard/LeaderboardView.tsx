import { useEffect, useState } from "react";
import { api, errorMessage, formatDate, type LeaderboardEntry } from "../api";
import styles from "../styles/views.module.scss";

/** Publiczny ranking: najlepszy wynik każdego gracza (R3). Odświeżany przy każdym wejściu. */
export function LeaderboardView({ active }: { active: boolean }) {
  const [entries, setEntries] = useState<LeaderboardEntry[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!active) return;
    let cancelled = false;
    api.leaderboard().then(
      (list) => !cancelled && setEntries(list),
      (err: unknown) => !cancelled && setError(errorMessage(err)),
    );
    return () => {
      cancelled = true;
    };
  }, [active]);

  return (
    <section className={styles.card}>
      <h2>Ranking</h2>
      {error && <p className={styles.error}>{error}</p>}
      {entries?.length === 0 && <p className={styles.muted}>Nikt jeszcze nie zapisał wyniku.</p>}
      {entries && entries.length > 0 && (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th className={styles.number}>#</th>
                <th>Gracz</th>
                <th className={styles.number}>Wynik</th>
                <th className={styles.number}>Linie</th>
                <th className={styles.number}>Poziom</th>
                <th>Data</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry) => (
                <tr key={entry.gameId}>
                  <td className={styles.number}>{entry.rank}</td>
                  <td>{entry.username}</td>
                  <td className={styles.number}>{entry.score}</td>
                  <td className={styles.number}>{entry.lines}</td>
                  <td className={styles.number}>{entry.level}</td>
                  <td>{formatDate(entry.endedAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
