import { useEffect, useState } from "react";
import { STATUS_LABELS } from "../../net/labels";
import { Lobby as LobbyStore } from "../../state/lobby";
import { useServer, useServerMessages } from "../hooks/server";
import { useStore } from "../hooks/store";
import viewStyles from "../ui/views.module.scss";
import { Lobby } from "./Lobby";
import { Match } from "./Match";
import { RoomCard } from "./RoomCard";
import styles from "./Versus.module.scss";

/** Widok 1v1 (spec 007): lista pokoi, zakładanie i dołączanie, poczekalnia i mecz. */
export function VersusView({ active, guest }: { active: boolean; guest: boolean }) {
  const { send, status } = useServer();
  const [lobby] = useState(() => new LobbyStore(send));
  const { rooms, room, error } = useStore(lobby);
  const online = status === "online";
  const inRoom = room !== null;

  useServerMessages((msg) => lobby.receive(msg));

  // Lista pokoi płynie tylko, gdy gracz ją widzi; po ponownym połączeniu subskrybujemy od nowa.
  useEffect(() => {
    if (!active || !online || inRoom) return;
    return lobby.watchRooms();
  }, [active, online, inRoom, lobby]);

  // Link `#/pokoj/<kod>`: dołączamy raz i zamieniamy adres na `#/1v1`.
  useEffect(() => {
    if (!active || !online) return;
    if (lobby.followLink(window.location.hash)) window.history.replaceState(null, "", "#/1v1");
  }, [active, online, inRoom, lobby]);

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
          <RoomCard room={room} onReady={lobby.ready} onLeave={lobby.leave} />
        ) : (
          <Lobby lobby={lobby} list={rooms} guest={guest} />
        )}
      </div>
      <Match active={active} room={room} onReady={lobby.ready} onLeave={lobby.leave} />
    </div>
  );
}
