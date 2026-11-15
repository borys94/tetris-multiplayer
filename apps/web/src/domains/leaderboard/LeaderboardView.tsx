import { api } from '../../core/api/client'
import { formatDate } from '../../core/format'
import { useApiData } from '../../hooks/use-api-data'
import { Card, DataTable, ErrorMessage, Note } from '../../ui'

/** Publiczny ranking: najlepszy wynik każdego gracza (spec ranking-historia, R3). Odświeżany przy każdym wejściu. */
export const LeaderboardView = ({ active }: { active: boolean }) => {
  const { data: entries, error } = useApiData(api.leaderboard, { enabled: active })

  return (
    <Card title="Ranking">
      {error && <ErrorMessage>{error}</ErrorMessage>}
      {entries?.length === 0 && <Note>Nikt jeszcze nie zapisał wyniku.</Note>}
      {entries && entries.length > 0 && (
        <DataTable
          rows={entries}
          rowKey={(entry) => entry.gameId}
          columns={[
            { header: '#', numeric: true, cell: (entry) => entry.rank },
            { header: 'Gracz', cell: (entry) => entry.username },
            { header: 'Wynik', numeric: true, cell: (entry) => entry.score },
            { header: 'Linie', numeric: true, cell: (entry) => entry.lines },
            { header: 'Poziom', numeric: true, cell: (entry) => entry.level },
            { header: 'Data', cell: (entry) => formatDate(entry.endedAt) },
          ]}
        />
      )}
    </Card>
  )
}
