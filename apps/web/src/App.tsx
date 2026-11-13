import { BOARD_HEIGHT, BOARD_WIDTH } from "@tetris/game-core";

export function App() {
  return (
    <main>
      <h1>Tetris Multiplayer</h1>
      <p>
        Plansza {BOARD_WIDTH}×{BOARD_HEIGHT}
      </p>
    </main>
  );
}
