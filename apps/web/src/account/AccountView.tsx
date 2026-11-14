import { useEffect, useState, type FormEvent } from "react";
import { api, errorMessage, formatDate, type SavedGame } from "../api";
import styles from "../styles/views.module.scss";
import { useAccount } from "./AccountContext";

type Mode = "login" | "register";

function AuthForm() {
  const { login, register } = useAccount();
  const [mode, setMode] = useState<Mode>("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await (mode === "login" ? login : register)(username, password);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className={styles.card}>
      <div className={styles.tabs} role="tablist">
        {(["login", "register"] as const).map((tab) => (
          <button
            key={tab}
            type="button"
            role="tab"
            className={styles.tab}
            aria-selected={mode === tab}
            onClick={() => {
              setMode(tab);
              setError(null);
            }}
          >
            {tab === "login" ? "Logowanie" : "Rejestracja"}
          </button>
        ))}
      </div>
      <form className={styles.form} onSubmit={(event) => void submit(event)}>
        <label className={styles.field}>
          Login
          <input
            name="username"
            autoComplete="username"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            required
          />
        </label>
        <label className={styles.field}>
          Hasło
          <input
            name="password"
            type="password"
            autoComplete={mode === "login" ? "current-password" : "new-password"}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />
        </label>
        {mode === "register" && <p className={styles.muted}>Hasło: co najmniej 10 znaków.</p>}
        {error && (
          <p className={styles.error} role="alert">
            {error}
          </p>
        )}
        <button className={styles.button} type="submit" disabled={busy}>
          {mode === "login" ? "Zaloguj" : "Załóż konto"}
        </button>
      </form>
    </section>
  );
}

function History({ active }: { active: boolean }) {
  const [games, setGames] = useState<SavedGame[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!active) return;
    let cancelled = false;
    api.myGames().then(
      (list) => !cancelled && setGames(list),
      (err: unknown) => !cancelled && setError(errorMessage(err)),
    );
    return () => {
      cancelled = true;
    };
  }, [active]);

  return (
    <section className={styles.card}>
      <h2>Twoje gry</h2>
      {error && <p className={styles.error}>{error}</p>}
      {games?.length === 0 && <p className={styles.muted}>Nie masz jeszcze zapisanych gier.</p>}
      {games && games.length > 0 && (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Data</th>
                <th className={styles.number}>Wynik</th>
                <th className={styles.number}>Linie</th>
                <th className={styles.number}>Poziom</th>
              </tr>
            </thead>
            <tbody>
              {games.map((game) => (
                <tr key={game.id}>
                  <td>{formatDate(game.endedAt)}</td>
                  <td className={styles.number}>{game.score}</td>
                  <td className={styles.number}>{game.lines}</td>
                  <td className={styles.number}>{game.level}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

/** Logowanie i rejestracja albo profil z historią gier (R1, R3). */
export function AccountView({ active }: { active: boolean }) {
  const { user, logout } = useAccount();
  if (user === undefined) return null;
  if (user === null) return <AuthForm />;

  return (
    <div className={styles.view}>
      <section className={styles.card}>
        <div className={styles.row}>
          <h2>Zalogowano jako {user.username}</h2>
          <button className={styles.secondary} onClick={() => void logout()}>
            Wyloguj
          </button>
        </div>
      </section>
      <History active={active} />
    </div>
  );
}
