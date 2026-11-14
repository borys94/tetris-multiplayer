import { useCallback, useEffect, useState, type FormEvent } from "react";
import { useAccount } from "../account/AccountContext";
import { api, errorMessage, formatDate, type AdminUser, type SavedGame } from "../api";
import styles from "../styles/views.module.scss";

function UserGames({ user }: { user: AdminUser }) {
  const [games, setGames] = useState<SavedGame[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    api.admin.games(user.id).then(
      (list) => !cancelled && setGames(list),
      (err: unknown) => !cancelled && setError(errorMessage(err)),
    );
    return () => {
      cancelled = true;
    };
  }, [user.id]);

  const remove = async (game: SavedGame) => {
    if (!window.confirm(`Usunąć wynik ${game.score} gracza ${user.username}?`)) return;
    try {
      await api.admin.deleteGame(game.id);
      setGames((list) => list?.filter((g) => g.id !== game.id) ?? null);
    } catch (err) {
      setError(errorMessage(err));
    }
  };

  if (error) return <p className={styles.error}>{error}</p>;
  if (!games) return null;
  if (games.length === 0) return <p className={styles.muted}>Brak gier.</p>;
  return (
    <table className={styles.table} aria-label={`Gry ${user.username}`}>
      <tbody>
        {games.map((game) => (
          <tr key={game.id}>
            <td>{formatDate(game.endedAt)}</td>
            <td className={styles.number}>{game.score}</td>
            <td>
              <button className={styles.secondary} onClick={() => void remove(game)}>
                Usuń wynik
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function UserRow({
  user,
  self,
  onChange,
}: {
  user: AdminUser;
  self: boolean;
  onChange: (user: AdminUser) => void;
}) {
  const [password, setPassword] = useState<string | null>(null);
  const [showGames, setShowGames] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = async (action: () => Promise<void>) => {
    setError(null);
    try {
      await action();
    } catch (err) {
      setError(errorMessage(err));
    }
  };

  const update = (changes: { role?: "admin" | null; disabled?: boolean }) =>
    run(async () => onChange(await api.admin.update(user.id, changes)));

  const resetPassword = () =>
    run(async () => {
      if (
        !window.confirm(`Ustawić hasło tymczasowe dla ${user.username}? Gracz zostanie wylogowany.`)
      ) {
        return;
      }
      setPassword(await api.admin.resetPassword(user.id));
    });

  return (
    <>
      <tr>
        <td>
          {user.username}
          {user.role === "admin" && " (admin)"}
          {user.disabled && " · zablokowany"}
        </td>
        <td>{formatDate(user.createdAt)}</td>
        <td>
          <div className={styles.row}>
            <button
              className={styles.secondary}
              disabled={self}
              onClick={() => void update({ role: user.role === "admin" ? null : "admin" })}
            >
              {user.role === "admin" ? "Odbierz admina" : "Nadaj admina"}
            </button>
            <button
              className={styles.secondary}
              disabled={self}
              onClick={() => void update({ disabled: !user.disabled })}
            >
              {user.disabled ? "Odblokuj" : "Zablokuj"}
            </button>
            <button className={styles.secondary} onClick={() => void resetPassword()}>
              Hasło tymczasowe
            </button>
            <button className={styles.secondary} onClick={() => setShowGames((v) => !v)}>
              {showGames ? "Ukryj gry" : "Gry"}
            </button>
          </div>
          {password && (
            <p className={styles.muted}>
              Hasło tymczasowe (pokazane tylko raz):{" "}
              <code className={styles.secret}>{password}</code>
            </p>
          )}
          {error && <p className={styles.error}>{error}</p>}
        </td>
      </tr>
      {showGames && (
        <tr>
          <td colSpan={3}>
            <UserGames user={user} />
          </td>
        </tr>
      )}
    </>
  );
}

/** Panel admina (R4). Widoczny tylko dla roli admin; uprawnienia i tak sprawdza serwer. */
export function AdminView({ active }: { active: boolean }) {
  const { user } = useAccount();
  const [query, setQuery] = useState("");
  const [users, setUsers] = useState<AdminUser[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const search = useCallback(async (q: string) => {
    try {
      setUsers(await api.admin.users(q));
      setError(null);
    } catch (err) {
      setError(errorMessage(err));
    }
  }, []);

  // Po wejściu do panelu pokazujemy najnowsze konta.
  useEffect(() => {
    if (!active || user?.role !== "admin") return;
    let cancelled = false;
    api.admin.users("").then(
      (list) => !cancelled && setUsers(list),
      (err: unknown) => !cancelled && setError(errorMessage(err)),
    );
    return () => {
      cancelled = true;
    };
  }, [active, user]);

  if (user?.role !== "admin") return null;

  const submit = (event: FormEvent) => {
    event.preventDefault();
    void search(query);
  };
  const replace = (changed: AdminUser) =>
    setUsers((list) => list?.map((u) => (u.id === changed.id ? changed : u)) ?? null);

  return (
    <section className={styles.card}>
      <h2>Panel admina</h2>
      <form className={styles.row} onSubmit={submit} role="search">
        <label className={styles.field}>
          Szukaj gracza
          <input value={query} onChange={(event) => setQuery(event.target.value)} />
        </label>
        <button className={styles.button} type="submit">
          Szukaj
        </button>
      </form>
      {error && <p className={styles.error}>{error}</p>}
      {users && (
        <div className={styles.tableWrap}>
          <table className={styles.table} aria-label="Konta">
            <thead>
              <tr>
                <th>Login</th>
                <th>Założone</th>
                <th>Akcje</th>
              </tr>
            </thead>
            <tbody>
              {users.map((account) => (
                <UserRow
                  key={account.id}
                  user={account}
                  self={account.id === user.id}
                  onChange={replace}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
