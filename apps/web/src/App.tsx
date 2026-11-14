import styles from "./App.module.scss";
import { Game } from "./components/Game";

export function App() {
  return (
    <main className={styles.app}>
      <h1 className={styles.title}>Tetris Multiplayer</h1>
      <Game />
      <p className={styles.controls}>
        ←/→ ruch · ↓ soft drop · Spacja hard drop · ↑/X obrót w prawo · Z obrót w lewo · C hold · P
        pauza
      </p>
    </main>
  );
}
