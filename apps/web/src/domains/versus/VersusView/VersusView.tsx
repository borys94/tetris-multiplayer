import { useEffect, useState } from 'react'
import { useMatch, useNavigate } from 'react-router'
import { STATUS_LABELS } from '../../../core/net/labels'
import { PATHS, ROOM_PATH } from '../../../core/routes'
import { useServer, useServerMessages } from '../../../hooks/server'
import { useStore } from '../../../hooks/store'
import { ErrorMessage, Note, Page } from '../../../ui'
import { Lobby as LobbyStore } from '../model/lobby'
import { Lobby } from '../Lobby'
import { Match } from '../Match/Match'
import { RoomCard } from '../RoomCard/RoomCard'
import styles from './VersusView.module.scss'

/** Widok 1v1 (spec versus-1v1): lista pokoi, zakładanie i dołączanie, poczekalnia i mecz. */
export const VersusView = ({ active, guest }: { active: boolean; guest: boolean }) => {
  const { send, status } = useServer()
  const [lobby] = useState(() => new LobbyStore(send))
  const { rooms, room, error } = useStore(lobby)
  const online = status === 'online'
  const inRoom = room !== null
  const linkCode = useMatch(ROOM_PATH)?.params.code
  const navigate = useNavigate()

  useServerMessages((msg) => lobby.receive(msg))

  // Lista pokoi płynie tylko, gdy gracz ją widzi; po ponownym połączeniu subskrybujemy od nowa.
  useEffect(() => {
    if (!active || !online || inRoom) {
      return
    }
    return lobby.watchRooms()
  }, [active, online, inRoom, lobby])

  // Link `/pokoj/<kod>`: dołączamy po połączeniu i zamieniamy adres na `/1v1`.
  useEffect(() => {
    if (linkCode === undefined || !online) {
      return
    }
    lobby.followLink(linkCode)
    void navigate(PATHS.versus, { replace: true })
  }, [linkCode, online, lobby, navigate])

  return (
    <div className={styles.versus}>
      <Page>
        {!online && <Note>{STATUS_LABELS[status]}</Note>}
        {error && <ErrorMessage role="alert">{error}</ErrorMessage>}
        {room ? (
          <RoomCard room={room} onReady={lobby.ready} onLeave={lobby.leave} />
        ) : (
          <Lobby lobby={lobby} list={rooms} guest={guest} />
        )}
      </Page>
      <Match active={active} room={room} onReady={lobby.ready} onLeave={lobby.leave} />
    </div>
  )
}
