import styles from "./App.module.scss";
import type { View } from "../app/routes";
import type { ConnectFn } from "../net/game-server";
import { AccountView } from "./account/AccountView";
import { AdminView } from "./admin/AdminView";
import { AccountProvider, useAccount } from "./hooks/account";
import { ServerProvider } from "./hooks/server";
import { useView } from "./hooks/use-view";
import { LeaderboardView } from "./leaderboard/LeaderboardView";
import { SoloGame } from "./solo/SoloGame";
import { VersusView } from "./versus/VersusView";

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
            <SoloGame active={view === "game"} guest={user === null} />
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
