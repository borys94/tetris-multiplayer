import { previewQueue, type GameState, type PieceType } from "@tetris/game-core";
import type { ClientMessage, ErrorCode, ServerMessage } from "@tetris/protocol";
import { useCallback, useEffect, useRef, useState } from "react";
import { InputController, isGameKey } from "../game/input";
import { startLoop } from "../game/loop";
import { BOARD_PIXEL_HEIGHT, BOARD_PIXEL_WIDTH, drawBoard } from "../game/render";
import {
  Connection,
  defaultServerUrl,
  type ConnectionHandlers,
  type ConnectionStatus,
} from "../net/connection";
import { Predictor } from "../net/predictor";
import styles from "./Game.module.scss";
import { PiecePreview } from "./PiecePreview";

/** Połączenie z serwerem gry widziane przez komponent (podmieniane w testach). */
export interface GameServer {
  send(msg: ClientMessage): boolean;
  stop(): void;
}

export type ConnectFn = (handlers: ConnectionHandlers) => GameServer;

export const connectToServer: ConnectFn = (handlers) => {
  const connection = new Connection(defaultServerUrl(window.location), handlers);
  connection.start();
  return connection;
};

type Screen = "loading" | "ready" | "playing" | "paused" | "over";

interface Hud {
  score: number;
  lines: number;
  level: number;
  hold: PieceType | null;
  next: readonly PieceType[];
}

interface Result {
  score: number;
  lines: number;
  level: number;
}

const STATUS_LABELS: Readonly<Record<ConnectionStatus, string>> = {
  connecting: "Łączenie z serwerem…",
  online: "Połączono",
  offline: "Brak połączenia, ponawiam…",
  closed: "Rozłączono (gra otwarta w innej karcie?)",
};

const ERROR_LABELS: Partial<Readonly<Record<ErrorCode, string>>> = {
  server_full: "Serwer jest pełny, spróbuj za chwilę",
  version: "Nowa wersja gry: odśwież stronę",
};

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

const EMPTY_HUD: Hud = { score: 0, lines: 0, level: 1, hold: null, next: [] };

/**
 * Gra liczona przez serwer (ADR-0006): klawisze → akcje przewidywane lokalnie
 * i wysyłane do serwera; wynik końcowy pochodzi z wiadomości `over`.
 */
interface GameProps {
  connect?: ConnectFn;
  /** Widok gry jest widoczny; po przejściu do innego widoku gra się wstrzymuje. */
  active?: boolean;
  /** Gość: wynik nie trafia do rankingu, więc po grze proponujemy konto (spec 005). */
  guest?: boolean;
}

export function Game({ connect = connectToServer, active = true, guest = false }: GameProps) {
  const [input] = useState(() => new InputController());
  const predictorRef = useRef<Predictor | null>(null);
  const serverRef = useRef<GameServer | null>(null);
  const screenRef = useRef<Screen>("loading");
  /** Po `newGame` wznawiamy grę od razu, gdy serwer przyśle jej stan. */
  const startOnGameRef = useRef(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [screen, setScreenState] = useState<Screen>("loading");
  const [status, setStatus] = useState<ConnectionStatus>("connecting");
  const [error, setError] = useState<ErrorCode | null>(null);
  const [hud, setHud] = useState<Hud>(EMPTY_HUD);
  const [result, setResult] = useState<Result | null>(null);

  const setScreen = useCallback((next: Screen) => {
    screenRef.current = next;
    setScreenState(next);
  }, []);

  const send = useCallback((msg: ClientMessage) => serverRef.current?.send(msg) ?? false, []);

  const refresh = useCallback(() => {
    const predictor = predictorRef.current;
    if (!predictor) return;
    const ctx = canvasRef.current?.getContext("2d");
    if (ctx) drawBoard(ctx, predictor.state);
    const next = hudOf(predictor.state);
    setHud((prev) => (sameHud(prev, next) ? prev : next));
  }, []);

  const play = useCallback(() => {
    if (send({ type: "resume" })) setScreen("playing");
  }, [send, setScreen]);

  const pause = useCallback(() => {
    input.reset();
    const predictor = predictorRef.current;
    if (predictor) send({ type: "pause", tick: predictor.tick });
    setScreen("paused");
  }, [input, send, setScreen]);

  const newGame = useCallback(() => {
    startOnGameRef.current = true;
    if (!send({ type: "newGame" })) {
      startOnGameRef.current = false;
      return;
    }
    input.reset();
    setResult(null);
    if (screenRef.current !== "playing") setScreen("loading");
  }, [input, send, setScreen]);

  const handleMessage = useCallback(
    (msg: ServerMessage) => {
      switch (msg.type) {
        case "game": {
          predictorRef.current = new Predictor(msg.state, msg.tick);
          refresh();
          if (msg.state.status === "over") {
            const { score, lines, level } = msg.state;
            setResult({ score, lines, level });
            setScreen("over");
          } else if (startOnGameRef.current) {
            startOnGameRef.current = false;
            play();
          } else {
            // Nierozpoczęta gra zostaje na ekranie startu; wznowiona po rozłączeniu jest wstrzymana.
            const notStarted = screenRef.current === "loading" || screenRef.current === "ready";
            setScreen(notStarted && msg.tick === 0 ? "ready" : "paused");
          }
          break;
        }
        case "snapshot": {
          const predictor = predictorRef.current;
          if (!predictor) break;
          if (screenRef.current === "playing") predictor.reconcile(msg.tick, msg.ackSeq, msg.state);
          else if (screenRef.current === "paused") predictor.adopt(msg.state, msg.tick);
          else break;
          refresh();
          break;
        }
        case "over":
          setResult({ score: msg.score, lines: msg.lines, level: msg.level });
          setScreen("over");
          break;
        case "error":
          setError(msg.code);
          break;
        case "welcome":
          setError(null);
          break;
      }
    },
    [play, refresh, setScreen],
  );

  const handleStatus = useCallback(
    (next: ConnectionStatus) => {
      setStatus(next);
      // Serwer wstrzymuje sesję po zerwaniu połączenia; klient robi to samo lokalnie.
      if (next !== "online" && screenRef.current === "playing") {
        input.reset();
        setScreen("paused");
      }
    },
    [input, setScreen],
  );

  useEffect(() => {
    const server = connect({ onMessage: handleMessage, onStatus: handleStatus });
    serverRef.current = server;
    return () => {
      server.stop();
      serverRef.current = null;
    };
  }, [connect, handleMessage, handleStatus]);

  // Pętla gry działa tylko na ekranie "playing".
  useEffect(() => {
    refresh();
    if (screen !== "playing") return;

    return startLoop(() => {
      const predictor = predictorRef.current;
      if (!predictor) return;
      const record = predictor.step(input.update());
      if (record)
        send({ type: "input", seq: record.seq, tick: record.tick, actions: [...record.actions] });
    }, refresh);
  }, [screen, refresh, input, send]);

  // Przejście do innego widoku (zmiana hasha w URL) wstrzymuje grę, tak jak utrata fokusu.
  useEffect(() => {
    if (!active) return;
    const onLeave = () => {
      if (screen === "playing") pause();
    };
    window.addEventListener("hashchange", onLeave);
    return () => window.removeEventListener("hashchange", onLeave);
  }, [active, screen, pause]);

  useEffect(() => {
    if (!active) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.code === "KeyP") {
        if (screen === "playing") pause();
        else if (screen === "paused") play();
        return;
      }
      if (event.code === "Enter") {
        if (screen === "ready") play();
        else if (screen === "over") newGame();
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
  }, [active, screen, play, pause, newGame, input]);

  const online = status === "online";

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
            {screen === "loading" && <p>{STATUS_LABELS[status]}</p>}
            {screen === "ready" && (
              <>
                <p>Naciśnij Enter, aby zacząć</p>
                <button className={styles.button} onClick={play} disabled={!online}>
                  Start
                </button>
              </>
            )}
            {screen === "paused" && (
              <>
                <p>Pauza</p>
                {!online && <p className={styles.finalScore}>{STATUS_LABELS[status]}</p>}
                <button className={styles.button} onClick={play} disabled={!online}>
                  Wznów
                </button>
                <button className={styles.button} onClick={newGame} disabled={!online}>
                  Restart
                </button>
              </>
            )}
            {screen === "over" && (
              <>
                <p>Koniec gry</p>
                <p className={styles.finalScore} data-testid="final-score">
                  Wynik: {result?.score ?? hud.score}
                </p>
                {guest && (
                  <p className={styles.hint}>
                    <a href="#/konto">Załóż konto</a>, aby zapisywać wyniki w rankingu
                  </p>
                )}
                <button className={styles.button} onClick={newGame} disabled={!online}>
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
        <p className={styles.status} data-status={status} role="status">
          {(error && ERROR_LABELS[error]) ?? STATUS_LABELS[status]}
        </p>
      </aside>
    </div>
  );
}
