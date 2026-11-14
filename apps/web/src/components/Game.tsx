import {
  applyAction,
  createGame,
  previewQueue,
  tick,
  type GameState,
  type PieceType,
} from "@tetris/game-core";
import { useCallback, useEffect, useRef, useState } from "react";
import { InputController, isGameKey } from "../game/input";
import { startLoop } from "../game/loop";
import { BOARD_PIXEL_HEIGHT, BOARD_PIXEL_WIDTH, drawBoard } from "../game/render";
import styles from "./Game.module.scss";
import { PiecePreview } from "./PiecePreview";

type Screen = "ready" | "playing" | "paused" | "over";

interface Hud {
  score: number;
  lines: number;
  level: number;
  hold: PieceType | null;
  next: readonly PieceType[];
}

function randomSeed(): number {
  return crypto.getRandomValues(new Uint32Array(1))[0] ?? 0;
}

function hudOf(state: GameState): Hud {
  return {
    score: state.score,
    lines: state.lines,
    level: state.level,
    hold: state.hold,
    next: previewQueue(state),
  };
}

function sameHud(a: Hud, b: Hud): boolean {
  return (
    a.score === b.score &&
    a.lines === b.lines &&
    a.level === b.level &&
    a.hold === b.hold &&
    a.next.join() === b.next.join()
  );
}

export function Game() {
  const [initialGame] = useState(() => createGame(randomSeed()));
  const [input] = useState(() => new InputController());
  const gameRef = useRef(initialGame);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [screen, setScreen] = useState<Screen>("ready");
  const [hud, setHud] = useState(() => hudOf(initialGame));

  const draw = useCallback(() => {
    const ctx = canvasRef.current?.getContext("2d");
    if (ctx) drawBoard(ctx, gameRef.current);
  }, []);

  const start = useCallback(() => {
    const game = createGame(randomSeed());
    gameRef.current = game;
    input.reset();
    setHud(hudOf(game));
    setScreen("playing");
  }, [input]);

  const pause = useCallback(() => {
    input.reset();
    setScreen("paused");
  }, [input]);

  // Pętla gry działa tylko na ekranie "playing"; na pozostałych rysujemy stan raz.
  useEffect(() => {
    draw();
    if (screen !== "playing") return;

    return startLoop(
      () => {
        let game = gameRef.current;
        for (const action of input.update()) game = applyAction(game, action);
        gameRef.current = tick(game);
      },
      () => {
        const game = gameRef.current;
        draw();
        const next = hudOf(game);
        setHud((prev) => (sameHud(prev, next) ? prev : next));
        if (game.status === "over") setScreen("over");
      },
    );
  }, [screen, draw, input]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.code === "KeyP") {
        if (screen === "playing") pause();
        else if (screen === "paused") setScreen("playing");
        return;
      }
      if (event.code === "Enter" && (screen === "ready" || screen === "over")) {
        start();
        return;
      }
      if (screen !== "playing" || !isGameKey(event.code)) return;
      event.preventDefault();
      if (!event.repeat) input.keyDown(event.code);
    };
    const onKeyUp = (event: KeyboardEvent) => input.keyUp(event.code);
    const onBlur = () => {
      if (screen === "playing") pause();
    };

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    window.addEventListener("blur", onBlur);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("blur", onBlur);
    };
  }, [screen, start, pause, input]);

  return (
    <div className={styles.game}>
      <aside className={styles.panel}>
        <h2>Hold</h2>
        <PiecePreview type={hud.hold} label="Hold" />
      </aside>

      <div className={styles.board}>
        <canvas
          ref={canvasRef}
          width={BOARD_PIXEL_WIDTH}
          height={BOARD_PIXEL_HEIGHT}
          role="img"
          aria-label="Plansza"
        />
        {screen !== "playing" && (
          <div className={styles.overlay}>
            {screen === "ready" && (
              <>
                <p>Naciśnij Enter, aby zacząć</p>
                <button className={styles.button} onClick={start}>
                  Start
                </button>
              </>
            )}
            {screen === "paused" && (
              <>
                <p>Pauza</p>
                <button className={styles.button} onClick={() => setScreen("playing")}>
                  Wznów
                </button>
                <button className={styles.button} onClick={start}>
                  Restart
                </button>
              </>
            )}
            {screen === "over" && (
              <>
                <p>Koniec gry</p>
                <p className={styles.finalScore}>Wynik: {hud.score}</p>
                <button className={styles.button} onClick={start}>
                  Zagraj ponownie
                </button>
              </>
            )}
          </div>
        )}
      </div>

      <aside className={styles.panel}>
        <h2>Następne</h2>
        {hud.next.map((type, index) => (
          <PiecePreview key={index} type={type} label={`Następny ${index + 1}`} />
        ))}
        <dl className={styles.stats}>
          <dt>Wynik</dt>
          <dd data-testid="score">{hud.score}</dd>
          <dt>Poziom</dt>
          <dd data-testid="level">{hud.level}</dd>
          <dt>Linie</dt>
          <dd data-testid="lines">{hud.lines}</dd>
        </dl>
      </aside>
    </div>
  );
}
