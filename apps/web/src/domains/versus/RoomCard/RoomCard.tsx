import { roomLink } from '../../../core/routes'
import { Button, Card, Code, Note, Row } from '../../../ui'
import { roomHint } from '../model/lobby'
import type { RoomMessage } from '../model/messages'
import styles from './RoomCard.module.scss'

/** Poczekalnia pokoju: gracze, gotowość, link dla przeciwnika. */
export const RoomCard = ({
  room,
  onReady,
  onLeave,
}: {
  room: RoomMessage
  onReady: () => void
  onLeave: () => void
}) => {
  const hint = roomHint(room)
  const me = room.players[room.you]
  const canReady = room.players.length === 2 && room.state === 'waiting' && !me?.ready

  return (
    <Card aria-label="Pokój">
      <Row>
        <h2>
          Pokój {room.visibility === 'private' ? 'prywatny' : 'publiczny'}{' '}
          <Code data-testid="room-code">{room.code}</Code>
        </h2>
        <Button variant="secondary" onClick={onLeave}>
          Wyjdź
        </Button>
      </Row>
      {room.visibility === 'private' && (
        <Note>
          Link dla przeciwnika: <Code>{roomLink(room.code)}</Code>
        </Note>
      )}
      <ul className={styles.players} aria-label="Gracze">
        {room.players.map((player, index) => (
          <li key={index}>
            {player.name}
            {index === room.you && ' (Ty)'}
            {player.host && ' · założyciel'}
            {player.ready && ' · gotowy'}
            {!player.connected && ' · rozłączony'}
          </li>
        ))}
      </ul>
      <Row>
        <Note role="status">{hint}</Note>
        {room.state === 'waiting' && (
          <Button onClick={onReady} disabled={!canReady}>
            Gotowe
          </Button>
        )}
      </Row>
    </Card>
  )
}
