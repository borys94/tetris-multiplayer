import { useState, type FormEvent } from "react";
import { waitingFor, type Lobby as LobbyStore, type RoomList } from "../../state/lobby";
import { useServer } from "../hooks/server";
import viewStyles from "../ui/views.module.scss";

/** Lista pokoi publicznych, zakładanie pokoju i dołączanie kodem (spec 007). */
export function Lobby({
  lobby,
  list,
  guest,
}: {
  lobby: LobbyStore;
  list: RoomList | null;
  guest: boolean;
}) {
  const rooms = list?.rooms;
  const { status } = useServer();
  const [code, setCode] = useState("");
  const online = status === "online";

  const join = (event: FormEvent) => {
    event.preventDefault();
    lobby.joinRoom(code);
  };

  return (
    <>
      <section className={viewStyles.card}>
        <h2>Gra 1v1</h2>
        <div className={viewStyles.row}>
          <button
            className={viewStyles.button}
            disabled={!online}
            onClick={() => lobby.createRoom("public")}
          >
            Załóż pokój publiczny
          </button>
          <button
            className={viewStyles.secondary}
            disabled={!online || guest}
            onClick={() => lobby.createRoom("private")}
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
                        onClick={() => lobby.joinRoom(room.code)}
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
