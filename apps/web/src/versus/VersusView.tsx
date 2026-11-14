import type { ErrorCode, RoomSummary } from "@tetris/protocol";
import { useEffect, useState, type FormEvent } from "react";
import { STATUS_LABELS } from "../components/Game";
import { useServer, useServerMessages } from "../net/server";
import viewStyles from "../styles/views.module.scss";
import { Match, type RoomMessage } from "./Match";
import styles from "./Versus.module.scss";

const ROOM_ERRORS: Partial<Readonly<Record<ErrorCode, string>>> = {
  room_not_found: "Nie ma takiego pokoju albo został zamknięty",
  room_full: "Pokój jest pełny albo mecz już trwa",
  room_limit: "Masz już otwarty pokój",
  login_required: "Pokój prywatny wymaga zalogowania",
  server_full: "Serwer jest pełny, spróbuj za chwilę",
};

/** Kod pokoju z linku `#/pokoj/<kod>`. */
export const ROOM_LINK = /^#\/pokoj\/([A-Za-z0-9]{6})$/;

export function roomLink(code: string): string {
  return `${window.location.origin}${window.location.pathname}#/pokoj/${code}`;
}

function waitingFor(createdAt: number, now: number): string {
  const minutes = Math.floor((now - createdAt) / 60_000);
  return minutes < 1 ? "przed chwilą" : `${minutes} min`;
}

/** Lista pokoi z chwilą jej otrzymania (do pokazania, jak długo pokój czeka). */
interface RoomList {
  rooms: RoomSummary[];
  receivedAt: number;
}

function Lobby({ list, guest }: { list: RoomList | null; guest: boolean }) {
  const rooms = list?.rooms;
  const { send, status } = useServer();
  const [code, setCode] = useState("");
  const online = status === "online";

  const join = (event: FormEvent) => {
    event.preventDefault();
    send({ type: "joinRoom", code: code.trim().toUpperCase() });
  };

  return (
    <>
      <section className={viewStyles.card}>
        <h2>Gra 1v1</h2>
        <div className={viewStyles.row}>
          <button
            className={viewStyles.button}
            disabled={!online}
            onClick={() => send({ type: "createRoom", visibility: "public" })}
          >
            Załóż pokój publiczny
          </button>
          <button
            className={viewStyles.secondary}
            disabled={!online || guest}
            onClick={() => send({ type: "createRoom", visibility: "private" })}
          >
            Załóż pokój prywatny
          </button>
        </div>
        {guest && (
          <p className={viewStyles.muted}>
            Pokój prywatny (wejście tylko z kodem) wymaga <a href="#/konto">zalogowania</a>.
          </p>
        )}
        <form className={viewStyles.row} onSubmit={join}>
          <label className={viewStyles.field}>
            Kod pokoju
            <input
              value={code}
              maxLength={6}
              autoComplete="off"
              onChange={(event) => setCode(event.target.value)}
            />
          </label>
          <button
            className={viewStyles.button}
            type="submit"
            disabled={!online || code.length !== 6}
          >
            Dołącz
          </button>
        </form>
      </section>

      <section className={viewStyles.card}>
        <h2>Otwarte pokoje</h2>
        {rooms?.length === 0 && (
          <p className={viewStyles.muted}>Brak otwartych pokoi. Załóż własny.</p>
        )}
        {rooms && rooms.length > 0 && (
          <div className={viewStyles.tableWrap}>
            <table className={viewStyles.table} aria-label="Otwarte pokoje">
              <thead>
                <tr>
                  <th>Założyciel</th>
                  <th>Czeka</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {rooms.map((room) => (
                  <tr key={room.code}>
                    <td>{room.host}</td>
                    <td>{waitingFor(room.createdAt, list.receivedAt)}</td>
                    <td>
                      <button
                        className={viewStyles.secondary}
                        disabled={!online}
                        onClick={() => send({ type: "joinRoom", code: room.code })}
                      >
                        Dołącz
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}

function RoomCard({
  room,
  onReady,
  onLeave,
}: {
  room: RoomMessage;
  onReady: () => void;
  onLeave: () => void;
}) {
  const me = room.players[room.you];
  const full = room.players.length === 2;
  const canReady = full && room.state === "waiting" && !me?.ready;
  const hint =
    room.state === "playing"
      ? "Mecz trwa"
      : room.state === "countdown"
        ? "Start za chwilę"
        : room.state === "finished"
          ? "Mecz zakończony"
          : !full
            ? "Czekamy na drugiego gracza"
            : me?.ready
              ? "Czekamy na gotowość przeciwnika"
              : "Kliknij „Gotowe”, gdy chcesz zacząć";

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

/** Widok 1v1 (spec 007): lista pokoi, zakładanie i dołączanie, poczekalnia i mecz. */
export function VersusView({ active, guest }: { active: boolean; guest: boolean }) {
  const { send, status } = useServer();
  const [rooms, setRooms] = useState<RoomList | null>(null);
  const [room, setRoom] = useState<RoomMessage | null>(null);
  const [error, setError] = useState<string | null>(null);
  const online = status === "online";
  const inRoom = room !== null;

  useServerMessages((msg) => {
    switch (msg.type) {
      case "rooms":
        setRooms({ rooms: msg.rooms, receivedAt: Date.now() });
        break;
      case "room":
        setRoom(msg);
        setError(null);
        break;
      case "roomClosed":
        setRoom(null);
        break;
      case "error":
        if (msg.code === "session_expired") setRoom(null);
        else if (ROOM_ERRORS[msg.code]) setError(ROOM_ERRORS[msg.code]!);
        break;
    }
  });

  // Lista pokoi płynie tylko, gdy gracz ją widzi; po ponownym połączeniu subskrybujemy od nowa.
  useEffect(() => {
    if (!active || !online || inRoom) return;
    send({ type: "watchRooms" });
    return () => void send({ type: "unwatchRooms" });
  }, [active, online, inRoom, send]);

  // Link `#/pokoj/<kod>`: dołączamy raz i zamieniamy adres na `#/1v1`.
  useEffect(() => {
    const match = ROOM_LINK.exec(window.location.hash);
    if (!active || !online || !match) return;
    window.history.replaceState(null, "", "#/1v1");
    if (!inRoom) send({ type: "joinRoom", code: match[1]!.toUpperCase() });
  }, [active, online, inRoom, send]);

  const ready = () => send({ type: "ready" });
  const leave = () => send({ type: "leaveRoom" });

  return (
    <div className={styles.versus}>
      <div className={viewStyles.view}>
        {!online && <p className={viewStyles.muted}>{STATUS_LABELS[status]}</p>}
        {error && (
          <p className={viewStyles.error} role="alert">
            {error}
          </p>
        )}
        {room ? (
          <RoomCard room={room} onReady={ready} onLeave={leave} />
        ) : (
          <Lobby list={rooms} guest={guest} />
        )}
      </div>
      <Match active={active} room={room} onReady={ready} onLeave={leave} />
    </div>
  );
}
