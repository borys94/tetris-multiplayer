import { roomLink } from "../../app/routes";
import { roomHint } from "../../state/lobby";
import type { RoomMessage } from "../../state/messages";
import viewStyles from "../ui/views.module.scss";
import styles from "./Versus.module.scss";

/** Poczekalnia pokoju: gracze, gotowość, link dla przeciwnika. */
export function RoomCard({
  room,
  onReady,
  onLeave,
}: {
  room: RoomMessage;
  onReady: () => void;
  onLeave: () => void;
}) {
  const hint = roomHint(room);
  const me = room.players[room.you];
  const canReady = room.players.length === 2 && room.state === "waiting" && !me?.ready;

  return (
    <section className={viewStyles.card} aria-label="Pokój">
      <div className={viewStyles.row}>
        <h2>
          Pokój {room.visibility === "private" ? "prywatny" : "publiczny"}{" "}
          <code className={viewStyles.secret} data-testid="room-code">
            {room.code}
          </code>
        </h2>
        <button className={viewStyles.secondary} onClick={onLeave}>
          Wyjdź
        </button>
      </div>
      {room.visibility === "private" && (
        <p className={viewStyles.muted}>
          Link dla przeciwnika: <code className={viewStyles.secret}>{roomLink(room.code)}</code>
        </p>
      )}
      <ul className={styles.players} aria-label="Gracze">
        {room.players.map((player, index) => (
          <li key={index}>
            {player.name}
            {index === room.you && " (Ty)"}
            {player.host && " · założyciel"}
            {player.ready && " · gotowy"}
            {!player.connected && " · rozłączony"}
          </li>
        ))}
      </ul>
      <div className={viewStyles.row}>
        <p className={viewStyles.muted} role="status">
          {hint}
        </p>
        {room.state === "waiting" && (
          <button className={viewStyles.button} onClick={onReady} disabled={!canReady}>
            Gotowe
          </button>
        )}
      </div>
    </section>
  );
}
