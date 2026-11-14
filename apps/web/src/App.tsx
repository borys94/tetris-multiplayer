import { useEffect, useState } from "react";
import styles from "./App.module.scss";
import { AccountProvider, useAccount } from "./account/AccountContext";
import { AccountView } from "./account/AccountView";
import { AdminView } from "./admin/AdminView";
import { Game, type ConnectFn } from "./components/Game";
import { LeaderboardView } from "./leaderboard/LeaderboardView";

type View = "game" | "ranking" | "account" | "admin";

const ROUTES: Readonly<Record<string, View>> = {
  "#/ranking": "ranking",
  "#/konto": "account",
  "#/admin": "admin",
};

function viewOf(hash: string): View {
  return ROUTES[hash] ?? "game";
}

/** Widok z hasha w URL (`#/ranking`), bez biblioteki routera (spec 005). */
function useView(): View {
  const [view, setView] = useState(() => viewOf(window.location.hash));
  useEffect(() => {
    const onChange = () => setView(viewOf(window.location.hash));
    window.addEventListener("hashchange", onChange);
    return () => window.removeEventListener("hashchange", onChange);
  }, []);
  return view;
}

function Shell({ connect }: { connect: ConnectFn | undefined }) {
  const { user } = useAccount();
  const view = useView();
  const link = (target: View) => (view === target ? { "aria-current": "page" as const } : {});

  return (
    <main className={styles.app}>
      <header className={styles.header}>
        <h1 className={styles.title}>Blockfall</h1>
        <nav className={styles.nav} aria-label="Menu">
          <a href="#/" {...link("game")}>
            Gra
          </a>
          <a href="#/ranking" {...link("ranking")}>
            Ranking
          </a>
          {user?.role === "admin" && (
            <a href="#/admin" {...link("admin")}>
              Admin
            </a>
          )}
          <a href="#/konto" {...link("account")}>
            {user ? user.username : "Zaloguj się"}
          </a>
        </nav>
      </header>

      {/* Gra zostaje zamontowana w tle, żeby przejście do rankingu nie kończyło partii.
          Zmiana konta tworzy nową sesję gry (klucz), bo WebSocket czyta cookie przy połączeniu. */}
      <div className={styles.gameView} hidden={view !== "game"}>
        {user !== undefined && (
          <Game
            key={user?.id ?? "guest"}
            {...(connect ? { connect } : {})}
            active={view === "game"}
            guest={user === null}
          />
        )}
        <p className={styles.controls}>
          ←/→ ruch · ↓ soft drop · Spacja hard drop · ↑/X obrót w prawo · Z obrót w lewo · C hold ·
          P pauza
        </p>
      </div>
      <div hidden={view !== "ranking"}>
        <LeaderboardView active={view === "ranking"} />
      </div>
      <div hidden={view !== "account"}>
        <AccountView active={view === "account"} />
      </div>
      <div hidden={view !== "admin"}>
        <AdminView active={view === "admin"} />
      </div>
    </main>
  );
}

export function App({ connect }: { connect?: ConnectFn }) {
  return (
    <AccountProvider>
      <Shell connect={connect} />
    </AccountProvider>
  );
}
