import { useState, type FormEvent } from 'react'
import { Link } from 'react-router'
import { PATHS } from '../../core/routes'
import { useServer } from '../../hooks/server'
import { Button, Card, DataTable, Field, Form, Input, Note, Row } from '../../ui'
import { waitingFor, type Lobby as LobbyStore, type RoomList } from './model/lobby'

/** Lista pokoi publicznych, zakładanie pokoju i dołączanie kodem (spec versus-1v1). */
export const Lobby = ({
  lobby,
  list,
  guest,
}: {
  lobby: LobbyStore
  list: RoomList | null
  guest: boolean
}) => {
  const { status } = useServer()
  const [code, setCode] = useState('')
  const online = status === 'online'

  const join = (event: FormEvent) => {
    event.preventDefault()
    lobby.joinRoom(code)
  }

  return (
    <>
      <Card title="Gra 1v1">
        <Row>
          <Button disabled={!online} onClick={() => lobby.createRoom('public')}>
            Załóż pokój publiczny
          </Button>
          <Button
            variant="secondary"
            disabled={!online || guest}
            onClick={() => lobby.createRoom('private')}
          >
            Załóż pokój prywatny
          </Button>
        </Row>
        {guest && (
          <Note>
            Pokój prywatny (wejście tylko z kodem) wymaga{' '}
            <Link to={PATHS.account}>zalogowania</Link>.
          </Note>
        )}
        <Form layout="row" onSubmit={join}>
          <Field label="Kod pokoju">
            <Input
              value={code}
              maxLength={6}
              autoComplete="off"
              onChange={(event) => setCode(event.target.value)}
            />
          </Field>
          <Button type="submit" disabled={!online || code.length !== 6}>
            Dołącz
          </Button>
        </Form>
      </Card>

      <Card title="Otwarte pokoje">
        {list?.rooms.length === 0 && <Note>Brak otwartych pokoi. Załóż własny.</Note>}
        {list && list.rooms.length > 0 && (
          <DataTable
            aria-label="Otwarte pokoje"
            rows={list.rooms}
            rowKey={(room) => room.code}
            columns={[
              { header: 'Założyciel', cell: (room) => room.host },
              { header: 'Czeka', cell: (room) => waitingFor(room.createdAt, list.receivedAt) },
              {
                header: '',
                cell: (room) => (
                  <Button
                    variant="secondary"
                    disabled={!online}
                    onClick={() => lobby.joinRoom(room.code)}
                  >
                    Dołącz
                  </Button>
                ),
              },
            ]}
          />
        )}
      </Card>
    </>
  )
}
