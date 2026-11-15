import { useCallback, useState, type FormEvent } from 'react'
import { api } from '../../core/api/client'
import { errorMessage } from '../../core/api/errors'
import type { AdminUser, SavedGame, UserChanges } from '../../core/api/types'
import { formatDate } from '../../core/format'
import { useApiData } from '../../hooks/use-api-data'
import {
  Button,
  Card,
  Code,
  ErrorMessage,
  Field,
  Form,
  Input,
  Note,
  Row,
  Table,
  Td,
  Th,
} from '../../ui'
import { useAccount } from '../account/use-account'

const UserGames = ({ user }: { user: AdminUser }) => {
  const {
    data: games,
    error,
    setData: setGames,
    setError,
  } = useApiData(() => api.admin.games(user.id), { key: user.id })

  const remove = async (game: SavedGame) => {
    if (!window.confirm(`Usunąć wynik ${game.score} gracza ${user.username}?`)) {
      return
    }
    try {
      await api.admin.deleteGame(game.id)
      setGames((list) => list?.filter((g) => g.id !== game.id) ?? null)
    } catch (err) {
      setError(errorMessage(err))
    }
  }

  if (error) {
    return <ErrorMessage>{error}</ErrorMessage>
  }
  if (!games) {
    return null
  }
  if (games.length === 0) {
    return <Note>Brak gier.</Note>
  }
  return (
    <Table aria-label={`Gry ${user.username}`}>
      <tbody>
        {games.map((game) => (
          <tr key={game.id}>
            <Td>{formatDate(game.endedAt)}</Td>
            <Td numeric>{game.score}</Td>
            <Td>
              <Button variant="secondary" onClick={() => void remove(game)}>
                Usuń wynik
              </Button>
            </Td>
          </tr>
        ))}
      </tbody>
    </Table>
  )
}

const UserRow = ({
  user,
  self,
  onChange,
}: {
  user: AdminUser
  self: boolean
  onChange: (user: AdminUser) => void
}) => {
  const [password, setPassword] = useState<string | null>(null)
  const [showGames, setShowGames] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const run = async (action: () => Promise<void>) => {
    setError(null)
    try {
      await action()
    } catch (err) {
      setError(errorMessage(err))
    }
  }

  const update = (changes: UserChanges) =>
    run(async () => onChange(await api.admin.update(user.id, changes)))

  const resetPassword = () =>
    run(async () => {
      if (
        !window.confirm(`Ustawić hasło tymczasowe dla ${user.username}? Gracz zostanie wylogowany.`)
      ) {
        return
      }
      setPassword(await api.admin.resetPassword(user.id))
    })

  return (
    <>
      <tr>
        <Td>
          {user.username}
          {user.role === 'admin' && ' (admin)'}
          {user.disabled && ' · zablokowany'}
        </Td>
        <Td>{formatDate(user.createdAt)}</Td>
        <Td>
          <Row>
            <Button
              variant="secondary"
              disabled={self}
              onClick={() => void update({ role: user.role === 'admin' ? null : 'admin' })}
            >
              {user.role === 'admin' ? 'Odbierz admina' : 'Nadaj admina'}
            </Button>
            <Button
              variant="secondary"
              disabled={self}
              onClick={() => void update({ disabled: !user.disabled })}
            >
              {user.disabled ? 'Odblokuj' : 'Zablokuj'}
            </Button>
            <Button variant="secondary" onClick={() => void resetPassword()}>
              Hasło tymczasowe
            </Button>
            <Button variant="secondary" onClick={() => setShowGames((v) => !v)}>
              {showGames ? 'Ukryj gry' : 'Gry'}
            </Button>
          </Row>
          {password && (
            <Note>
              Hasło tymczasowe (pokazane tylko raz): <Code>{password}</Code>
            </Note>
          )}
          {error && <ErrorMessage>{error}</ErrorMessage>}
        </Td>
      </tr>
      {showGames && (
        <tr>
          <Td colSpan={3}>
            <UserGames user={user} />
          </Td>
        </tr>
      )}
    </>
  )
}

/** Konta: wyszukiwanie, rola, blokada, hasło tymczasowe i gry gracza (spec panel-admina, R2–R3). */
export const UsersPanel = ({ active }: { active: boolean }) => {
  const { user } = useAccount()
  const [query, setQuery] = useState('')
  const isAdmin = user?.role === 'admin'
  // Po wejściu do panelu pokazujemy najnowsze konta.
  const {
    data: users,
    error,
    setData: setUsers,
    setError,
  } = useApiData(() => api.admin.users(''), { enabled: active && isAdmin, key: user?.id })

  const search = useCallback(
    async (q: string) => {
      try {
        setUsers(await api.admin.users(q))
        setError(null)
      } catch (err) {
        setError(errorMessage(err))
      }
    },
    [setUsers, setError],
  )

  if (!user || !isAdmin) {
    return null
  }

  const submit = (event: FormEvent) => {
    event.preventDefault()
    void search(query)
  }
  const replace = (changed: AdminUser) =>
    setUsers((list) => list?.map((u) => (u.id === changed.id ? changed : u)) ?? null)

  return (
    <Card title="Panel admina">
      <Form layout="row" onSubmit={submit} role="search">
        <Field label="Szukaj gracza">
          <Input value={query} onChange={(event) => setQuery(event.target.value)} />
        </Field>
        <Button type="submit">Szukaj</Button>
      </Form>
      {error && <ErrorMessage>{error}</ErrorMessage>}
      {users && (
        <Table aria-label="Konta">
          <thead>
            <tr>
              <Th>Login</Th>
              <Th>Założone</Th>
              <Th>Akcje</Th>
            </tr>
          </thead>
          <tbody>
            {users.map((account) => (
              <UserRow
                key={account.id}
                user={account}
                self={account.id === user.id}
                onChange={replace}
              />
            ))}
          </tbody>
        </Table>
      )}
    </Card>
  )
}
