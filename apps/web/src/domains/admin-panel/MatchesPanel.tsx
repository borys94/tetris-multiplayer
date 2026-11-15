import { useCallback, useState, type FormEvent } from 'react'
import { api } from '../../core/api/client'
import { errorMessage } from '../../core/api/errors'
import { PAGE_SIZE } from '../../core/api/types'
import { MATCH_END_LABELS, formatDate, formatDuration } from '../../core/format'
import { useApiData } from '../../hooks/use-api-data'
import { Button, Card, DataTable, ErrorMessage, Field, Form, Input, Note } from '../../ui'

/** Wszystkie zakończone mecze 1v1 z wyszukiwaniem po graczu i stronicowaniem (spec panel-admina, R5). */
export const MatchesPanel = ({ active }: { active: boolean }) => {
  const [query, setQuery] = useState('')
  // Pierwsza strona przy wejściu; wyszukiwanie i „Starsze” podmieniają lub dokładają strony.
  const {
    data: matches,
    error,
    setData: setMatches,
    setError,
  } = useApiData(() => api.admin.matches(''), { enabled: active })
  // Doczytujemy tylko po pełnej stronie, więc lista z samych pełnych stron może mieć starsze mecze.
  const more = matches !== null && matches.length > 0 && matches.length % PAGE_SIZE === 0

  const load = useCallback(
    async (q: string, before?: number) => {
      try {
        const page = await api.admin.matches(q, before)
        setMatches((list) => (before ? [...(list ?? []), ...page] : page))
        setError(null)
      } catch (err) {
        setError(errorMessage(err))
      }
    },
    [setMatches, setError],
  )

  const submit = (event: FormEvent) => {
    event.preventDefault()
    void load(query)
  }

  return (
    <Card title="Mecze 1v1">
      <Form layout="row" onSubmit={submit} role="search">
        <Field label="Gracz">
          <Input value={query} onChange={(event) => setQuery(event.target.value)} />
        </Field>
        <Button type="submit">Szukaj</Button>
      </Form>
      {error && <ErrorMessage>{error}</ErrorMessage>}
      {matches?.length === 0 && <Note>Brak meczów.</Note>}
      {matches && matches.length > 0 && (
        <DataTable
          aria-label="Wyniki meczów"
          rows={matches}
          rowKey={(match) => match.id}
          columns={[
            { header: 'Data', cell: (match) => formatDate(match.endedAt) },
            { header: 'Zwycięzca', cell: (match) => match.winnerName },
            { header: 'Przegrany', cell: (match) => match.loserName },
            { header: 'Powód', cell: (match) => MATCH_END_LABELS[match.reason] },
            {
              header: 'Linie',
              numeric: true,
              cell: (match) => `${match.winnerLinesSent} : ${match.loserLinesSent}`,
            },
            { header: 'Czas', numeric: true, cell: (match) => formatDuration(match.ticks) },
          ]}
        />
      )}
      {more && matches && (
        <Button
          variant="secondary"
          onClick={() => void load(query, matches[matches.length - 1]!.id)}
        >
          Starsze
        </Button>
      )}
    </Card>
  )
}
