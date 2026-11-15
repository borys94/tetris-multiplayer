import type { RoomState } from '@tetris/protocol'
import { api } from '../../core/api/client'
import { formatClock, formatDate } from '../../core/format'
import { useApiData } from '../../hooks/use-api-data'
import { Card, Code, DataTable, ErrorMessage, Note } from '../../ui'

/** Co ile odświeżamy pokoje i trwające mecze (spec panel-admina: odpytywanie zamiast WebSocketu). */
export const ROOMS_REFRESH_MS = 3000

const ROOM_STATES: Readonly<Record<RoomState, string>> = {
  waiting: 'czeka',
  countdown: 'odliczanie',
  playing: 'mecz trwa',
  finished: 'po meczu',
}

/** Wszystkie otwarte pokoje i trwające mecze, odświeżane co kilka sekund (spec panel-admina, R4). */
export const RoomsPanel = ({ active }: { active: boolean }) => {
  const { data: rooms, error } = useApiData(api.admin.rooms, {
    enabled: active,
    refreshMs: ROOMS_REFRESH_MS,
  })

  const playing = rooms?.flatMap((room) => (room.match ? [{ ...room, match: room.match }] : []))

  return (
    <>
      <Card title="Trwające mecze">
        {error && <ErrorMessage>{error}</ErrorMessage>}
        {playing?.length === 0 && <Note>Żaden mecz nie trwa.</Note>}
        {playing && playing.length > 0 && (
          <DataTable
            aria-label="Trwające mecze"
            rows={playing}
            rowKey={(room) => room.code}
            columns={[
              { header: 'Pokój', cell: (room) => room.code },
              {
                header: 'Gracze',
                cell: (room) => room.match.players.map((p) => p.name).join(' vs '),
              },
              { header: 'Czas', numeric: true, cell: (room) => formatClock(room.match.seconds) },
              {
                header: 'Wysłane linie',
                numeric: true,
                cell: (room) => room.match.players.map((p) => p.linesSent).join(' : '),
              },
            ]}
          />
        )}
      </Card>

      <Card title="Otwarte pokoje">
        {rooms?.length === 0 && <Note>Brak otwartych pokoi.</Note>}
        {rooms && rooms.length > 0 && (
          <DataTable
            aria-label="Pokoje"
            rows={rooms}
            rowKey={(room) => room.code}
            columns={[
              { header: 'Kod', cell: (room) => <Code>{room.code}</Code> },
              {
                header: 'Typ',
                cell: (room) => (room.visibility === 'private' ? 'prywatny' : 'publiczny'),
              },
              { header: 'Stan', cell: (room) => ROOM_STATES[room.state] },
              {
                header: 'Gracze',
                cell: (room) =>
                  room.players
                    .map((p) => `${p.name}${p.connected ? '' : ' (rozłączony)'}`)
                    .join(', '),
              },
              {
                header: 'Otwarty',
                cell: (room) => formatDate(new Date(room.createdAt).toISOString()),
              },
            ]}
          />
        )}
      </Card>
    </>
  )
}
