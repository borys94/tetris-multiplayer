import { useState, type FormEvent } from 'react'
import { api } from '../../core/api/client'
import { errorMessage } from '../../core/api/errors'
import { MATCH_END_LABELS, formatDate, formatDuration } from '../../core/format'
import { useApiData } from '../../hooks/use-api-data'
import {
  Button,
  Card,
  DataTable,
  ErrorMessage,
  Field,
  Form,
  Input,
  Note,
  Page,
  Row,
  Tabs,
} from '../../ui'
import { useAccount } from './use-account'

type Mode = 'login' | 'register'

const MODES = [
  { id: 'login', label: 'Logowanie' },
  { id: 'register', label: 'Rejestracja' },
] as const

const AuthForm = () => {
  const { login, register } = useAccount()
  const [mode, setMode] = useState<Mode>('login')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    setBusy(true)
    setError(null)
    try {
      await (mode === 'login' ? login : register)(username, password)
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <Card>
      <Tabs
        tabs={MODES}
        selected={mode}
        onSelect={(tab) => {
          setMode(tab)
          setError(null)
        }}
      />
      <Form onSubmit={(event) => void submit(event)}>
        <Field label="Login">
          <Input
            name="username"
            autoComplete="username"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            required
          />
        </Field>
        <Field label="Hasło">
          <Input
            name="password"
            type="password"
            autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />
        </Field>
        {mode === 'register' && <Note>Hasło: co najmniej 10 znaków.</Note>}
        {error && <ErrorMessage role="alert">{error}</ErrorMessage>}
        <Button type="submit" disabled={busy}>
          {mode === 'login' ? 'Zaloguj' : 'Załóż konto'}
        </Button>
      </Form>
    </Card>
  )
}

const History = ({ active }: { active: boolean }) => {
  const { data: games, error } = useApiData(api.myGames, { enabled: active })

  return (
    <Card title="Twoje gry">
      {error && <ErrorMessage>{error}</ErrorMessage>}
      {games?.length === 0 && <Note>Nie masz jeszcze zapisanych gier.</Note>}
      {games && games.length > 0 && (
        <DataTable
          rows={games}
          rowKey={(game) => game.id}
          columns={[
            { header: 'Data', cell: (game) => formatDate(game.endedAt) },
            { header: 'Wynik', numeric: true, cell: (game) => game.score },
            { header: 'Linie', numeric: true, cell: (game) => game.lines },
            { header: 'Poziom', numeric: true, cell: (game) => game.level },
          ]}
        />
      )}
    </Card>
  )
}

const MatchHistory = ({ active }: { active: boolean }) => {
  const { data: matches, error } = useApiData(api.myMatches, { enabled: active })

  return (
    <Card title="Twoje mecze 1v1">
      {error && <ErrorMessage>{error}</ErrorMessage>}
      {matches?.length === 0 && <Note>Nie masz jeszcze rozegranych meczów.</Note>}
      {matches && matches.length > 0 && (
        <DataTable
          aria-label="Mecze 1v1"
          rows={matches}
          rowKey={(match) => match.id}
          columns={[
            { header: 'Data', cell: (match) => formatDate(match.endedAt) },
            { header: 'Przeciwnik', cell: (match) => match.opponent },
            {
              header: 'Wynik',
              cell: (match) => (
                <span title={MATCH_END_LABELS[match.reason]}>
                  {match.won ? 'Wygrana' : 'Przegrana'}
                </span>
              ),
            },
            { header: 'Wysłane', numeric: true, cell: (match) => match.linesSent },
            { header: 'Otrzymane', numeric: true, cell: (match) => match.linesReceived },
            { header: 'Czas', numeric: true, cell: (match) => formatDuration(match.ticks) },
          ]}
        />
      )}
    </Card>
  )
}

/** Logowanie i rejestracja albo profil z historią gier i meczów (spec konta R1, ranking-historia R4). */
export const AccountView = ({ active }: { active: boolean }) => {
  const { user, logout } = useAccount()
  if (user === undefined) {
    return null
  }
  if (user === null) {
    return <AuthForm />
  }

  return (
    <Page>
      <Card>
        <Row>
          <h2>Zalogowano jako {user.username}</h2>
          <Button variant="secondary" onClick={() => void logout()}>
            Wyloguj
          </Button>
        </Row>
      </Card>
      <History active={active} />
      <MatchHistory active={active} />
    </Page>
  )
}
