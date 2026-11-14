import { garbageLines, previewQueue, type PieceType } from "@tetris/game-core";
import { COUNTDOWN_MS, type OpponentView, type ServerMessage } from "@tetris/protocol";
import { useCallback, useEffect, useRef, useState } from "react";
import { MATCH_END_LABELS } from "../api";
import { PiecePreview } from "../components/PiecePreview";
import gameStyles from "../components/Game.module.scss";
import { InputController, isGameKey } from "../game/input";
import { startLoop } from "../game/loop";
import { BOARD_PIXEL_HEIGHT, BOARD_PIXEL_WIDTH, drawBoard } from "../game/render";
import { Predictor } from "../net/predictor";
import { useServer, useServerMessages } from "../net/server";
import styles from "./Versus.module.scss";

export type RoomMessage = Extract<ServerMessage, { type: "room" }>;
type Result = Extract<ServerMessage, { type: "result" }>;
type Phase = "idle" | "playing" | "over";

const COUNTDOWN_SECONDS = COUNTDOWN_MS / 1000;

interface Hud {
  score: number;
  lines: number;
  linesSent: number;
  garbage: number;
  hold: PieceType | null;
  next: readonly PieceType[];
  opponentScore: number;
  opponentSent: number;
}

const EMPTY_HUD: Hud = {
  score: 0,
  lines: 0,
  linesSent: 0,
  garbage: 0,
  hold: null,
  next: [],
  opponentScore: 0,
  opponentSent: 0,
};

/** Opis końca meczu z punktu widzenia gracza. */
export function resultText(result: Result): string {
  if (result.won) {
    return {
      topout: "Plansza przeciwnika się przepełniła",
      left: "Przeciwnik wyszedł z meczu",
      timeout: "Przeciwnik nie wrócił po rozłączeniu",
    }[result.reason];
  }
  return `Przegrana: ${MATCH_END_LABELS[result.reason]}`;
}

function useCountdown(startsAt: number | undefined): number | null {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (startsAt === undefined) return;
    const update = () => setNow(Date.now());
    // Komponent żyje od wejścia na stronę: odświeżamy czas od razu, a nie po pierwszym interwale.
    const first = window.setTimeout(update, 0);
    const timer = window.setInterval(update, 200);
    return () => {
      window.clearTimeout(first);
      window.clearInterval(timer);
    };
  }, [startsAt]);
  if (startsAt === undefined) return null;
  // Do pierwszego odświeżenia `now` może być stare: nie pokazujemy więcej niż długość odliczania.
  return Math.min(COUNTDOWN_SECONDS, Math.max(0, Math.ceil((startsAt - now) / 1000)));
}

interface MatchProps {
  /** Widok 1v1 jest widoczny: tylko wtedy przechwytujemy klawisze. */
  active: boolean;
  room: RoomMessage | null;
  onReady: () => void;
  onLeave: () => void;
}

/**
 * Mecz 1v1 (spec 007): własna plansza przewidywana lokalnie jak w singleplayerze
 * (ADR-0006), bez pauzy, i plansza przeciwnika ze snapshotów serwera.
 * Komponent jest zawsze zamontowany, bo `match` przychodzi zaraz po `room`.
 */
export function Match({ active, room, onReady, onLeave }: MatchProps) {
  const { send } = useServer();
  const [input] = useState(() => new InputController());
  const predictorRef = useRef<Predictor | null>(null);
  const opponentRef = useRef<OpponentView | null>(null);
  const ownCanvas = useRef<HTMLCanvasElement>(null);
  const opponentCanvas = useRef<HTMLCanvasElement>(null);
  const [phase, setPhase] = useState<Phase>("idle");
  const [result, setResult] = useState<Result | null>(null);
  const [hud, setHud] = useState<Hud>(EMPTY_HUD);
  const countdown = useCountdown(room?.state === "countdown" ? room.startsAt : undefined);

  const refresh = useCallback(() => {
    const state = predictorRef.current?.state;
    const opponent = opponentRef.current;
    const own = ownCanvas.current?.getContext("2d");
    const other = opponentCanvas.current?.getContext("2d");
    if (state && own) drawBoard(own, state);
    if (opponent && other) drawBoard(other, opponent);
    if (!state) return;
    const next: Hud = {
      score: state.score,
      lines: state.lines,
      linesSent: state.linesSent,
      garbage: garbageLines(state.garbage),
      hold: state.hold,
      next: previewQueue(state),
      opponentScore: opponent?.score ?? 0,
      opponentSent: opponent?.linesSent ?? 0,
    };
    setHud((prev) =>
      Object.entries(next).every(([key, value]) => {
        const old = prev[key as keyof Hud];
        return Array.isArray(value) ? (old as PieceType[]).join() === value.join() : old === value;
      })
        ? prev
        : next,
    );
  }, []);

  useServerMessages((msg) => {
    switch (msg.type) {
      case "match":
        predictorRef.current = new Predictor(msg.state, msg.tick);
        opponentRef.current = msg.opponent;
        input.reset();
        setResult(null);
        setPhase("playing");
        refresh();
        break;
      case "matchSnapshot": {
        const predictor = predictorRef.current;
        if (!predictor) break;
        if (phase === "playing") predictor.reconcile(msg.tick, msg.ackSeq, msg.state);
        else predictor.adopt(msg.state, msg.tick);
        opponentRef.current = msg.opponent;
        refresh();
        break;
      }
      case "result":
        input.reset();
        setResult(msg);
        setPhase("over");
        break;
      case "roomClosed":
        predictorRef.current = null;
        opponentRef.current = null;
        setPhase("idle");
        setResult(null);
        break;
      case "error":
        if (msg.code === "session_expired") setPhase("idle");
        break;
    }
  });

  // Pętla przewidywania działa przez cały mecz, także gdy gracz zajrzy do innego widoku.
  useEffect(() => {
    refresh();
    if (phase !== "playing") return;
    return startLoop(() => {
      const record = predictorRef.current?.step(input.update());
      if (record) {
        send({ type: "input", seq: record.seq, tick: record.tick, actions: [...record.actions] });
      }
    }, refresh);
  }, [phase, input, send, refresh]);

  useEffect(() => {
    if (!active || phase !== "playing") return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (!isGameKey(event.code)) return;
      event.preventDefault();
      if (!event.repeat) input.keyDown(event.code);
    };
    const onKeyUp = (event: KeyboardEvent) => input.keyUp(event.code);
    // Mecz nie ma pauzy: utrata fokusu tylko puszcza wciśnięte klawisze.
    const onBlur = () => input.reset();
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    window.addEventListener("blur", onBlur);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("blur", onBlur);
    };
  }, [active, phase, input]);

  if (!room || (phase === "idle" && room.state !== "countdown")) return null;

  const me = room.players[room.you];
  const opponent = room.players.find((_, index) => index !== room.you);
  const canRematch = room.state === "finished" && room.players.length === 2;
  const garbageHeight = `${Math.min(100, (hud.garbage / 20) * 100)}%`;

  return (
    <div className={styles.match}>
      <div className={gameStyles.panel}>
        <h2>Hold</h2>
        <PiecePreview type={hud.hold} label="Hold" />
        <h2>Następne</h2>
        {hud.next.map((type, index) => (
          <PiecePreview key={index} type={type} label={`Następny ${index + 1}`} />
        ))}
      </div>

      <figure className={styles.player}>
        <figcaption>{me?.name ?? "Ty"}</figcaption>
        <div className={styles.boardRow}>
          <div
            className={styles.garbage}
            role="meter"
            aria-label="Nadchodzące śmieci"
            aria-valuemin={0}
            aria-valuemax={20}
            aria-valuenow={hud.garbage}
          >
            <span style={{ height: garbageHeight }} />
          </div>
          <div className={gameStyles.board}>
            <canvas
              ref={ownCanvas}
              width={BOARD_PIXEL_WIDTH}
              height={BOARD_PIXEL_HEIGHT}
              role="img"
              aria-label="Twoja plansza"
            />
            {room.state === "countdown" && countdown !== null && (
              <div className={gameStyles.overlay}>
                <p className={styles.countdown} data-testid="countdown">
                  {countdown}
                </p>
              </div>
            )}
            {phase === "over" && result && (
              <div className={gameStyles.overlay}>
                <p>{result.won ? "Wygrana!" : "Przegrana"}</p>
                <p className={gameStyles.finalScore}>{resultText(result)}</p>
                {canRematch && (
                  <button
                    className={gameStyles.button}
                    onClick={onReady}
                    disabled={me?.ready ?? false}
                  >
                    {me?.ready ? "Czekamy na przeciwnika…" : "Rewanż"}
                  </button>
                )}
                <button className={gameStyles.button} onClick={onLeave}>
                  Wyjdź z pokoju
                </button>
              </div>
            )}
          </div>
        </div>
        <dl className={gameStyles.stats}>
          <dt>Wynik</dt>
          <dd data-testid="score">{hud.score}</dd>
          <dt>Linie</dt>
          <dd>{hud.lines}</dd>
          <dt>Wysłane</dt>
          <dd data-testid="lines-sent">{hud.linesSent}</dd>
        </dl>
      </figure>

      <figure className={styles.player}>
        <figcaption>
          {opponent?.name ?? "Przeciwnik"}
          {opponent && !opponent.connected && " (rozłączony)"}
        </figcaption>
        <div className={gameStyles.board}>
          <canvas
            ref={opponentCanvas}
            width={BOARD_PIXEL_WIDTH}
            height={BOARD_PIXEL_HEIGHT}
            role="img"
            aria-label="Plansza przeciwnika"
          />
        </div>
        <dl className={gameStyles.stats}>
          <dt>Wynik</dt>
          <dd>{hud.opponentScore}</dd>
          <dt>Wysłane</dt>
          <dd>{hud.opponentSent}</dd>
        </dl>
      </figure>
    </div>
  );
}
