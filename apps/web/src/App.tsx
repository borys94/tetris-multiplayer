import styles from "./App.module.scss";
import { Game, type ConnectFn } from "./components/Game";

export function App({ connect }: { connect?: ConnectFn }) {
  return (
    <main className={styles.app}>
      <h1 className={styles.title}>Blockfall</h1>
      <Game {...(connect ? { connect } : {})} />
      <p className={styles.controls}>
        ←/→ ruch · ↓ soft drop · Spacja hard drop · ↑/X obrót w prawo · Z obrót w lewo · C hold · P
        pauza
      </p>
    </main>
  );
}
