import { useEffect, useState } from "react";
import styles from "./App.module.scss";
import { AccountProvider, useAccount } from "./account/AccountContext";
import { AccountView } from "./account/AccountView";
import { AdminView } from "./admin/AdminView";
import { Game } from "./components/Game";
import { LeaderboardView } from "./leaderboard/LeaderboardView";
import { ServerProvider, type ConnectFn } from "./net/server";
import { ROOM_LINK, VersusView } from "./versus/VersusView";

type View = "game" | "versus" | "ranking" | "account" | "admin";

const ROUTES: Readonly<Record<string, View>> = {
  "#/1v1": "versus",
  "#/ranking": "ranking",
  "#/konto": "account",
  "#/admin": "admin",
};

function viewOf(hash: string): View {
  if (ROOM_LINK.test(hash)) return "versus";
  return ROUTES[hash] ?? "game";
}

/** Widok z hasha w URL (`#/ranking`, `#/pokoj/<kod>`), bez biblioteki routera (spec 005). */
function useView(): View {
  const [view, setView] = useState(() => viewOf(window.location.hash));
  useEffect(() => {
    const onChange = () => setView(viewOf(window.location.hash));
    window.addEventListener("hashchange", onChange);
    return () => window.removeEventListener("hashchange", onChange);
  }, []);
  return view;
}

const CONTROLS =
  "←/→ ruch · ↓ soft drop · Spacja hard drop · ↑/X obrót w prawo · Z obrót w lewo · C hold";

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
          <a href="#/1v1" {...link("versus")}>
            1v1
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

      {/* Gra i pokoje zostają zamontowane w tle, żeby przejście do rankingu nie kończyło partii.
          Oba widoki dzielą jedno połączenie (pokój jest przypięty do sesji gry). Zmiana konta
          tworzy nowe połączenie i sesję (klucz), bo WebSocket czyta cookie przy połączeniu. */}
      {user !== undefined && (
        <ServerProvider key={user?.id ?? "guest"} connect={connect}>
          <div className={styles.gameView} hidden={view !== "game"}>
            <Game active={view === "game"} guest={user === null} />
            <p className={styles.controls}>{CONTROLS} · P pauza</p>
          </div>
          <div className={styles.gameView} hidden={view !== "versus"}>
            <VersusView active={view === "versus"} guest={user === null} />
            <p className={styles.controls}>{CONTROLS}</p>
          </div>
        </ServerProvider>
      )}
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
