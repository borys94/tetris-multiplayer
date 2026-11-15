import { useState } from 'react'
import { createBrowserRouter, Navigate, NavLink, Outlet, type RouteObject } from 'react-router'
import { RouterProvider } from 'react-router/dom'
import type { ConnectFn } from '../../core/net/game-server'
import { legacyHashPath, PATHS, ROOM_PATH, type View } from '../../core/routes'
import { AccountView } from '../../domains/account/AccountView'
import { AccountProvider, useAccount } from '../../domains/account/use-account'
import { AdminView } from '../../domains/admin-panel/AdminView'
import { SoloGame } from '../../domains/game/SoloGame'
import { LeaderboardView } from '../../domains/leaderboard/LeaderboardView'
import { VersusView } from '../../domains/versus/VersusView/VersusView'
import { ServerProvider } from '../../hooks/server'
import { useView, type ViewHandle } from '../use-view'
import styles from './App.module.scss'

const CONTROLS =
  '←/→ ruch · ↓ soft drop · Spacja hard drop · ↑/X obrót w prawo · Z obrót w lewo · C hold'

const Shell = ({ connect }: { connect: ConnectFn | undefined }) => {
  const { user } = useAccount()
  const view = useView()

  return (
    <main className={styles.app}>
      <header className={styles.header}>
        <h1 className={styles.title}>Blockfall</h1>
        <nav className={styles.nav} aria-label="Menu">
          <NavLink to={PATHS.game} end>
            Gra
          </NavLink>
          <NavLink to={PATHS.versus}>1v1</NavLink>
          <NavLink to={PATHS.ranking}>Ranking</NavLink>
          {user?.role === 'admin' && <NavLink to={PATHS.admin}>Admin</NavLink>}
          <NavLink to={PATHS.account}>{user ? user.username : 'Zaloguj się'}</NavLink>
        </nav>
      </header>

      {/* Gra i pokoje zostają zamontowane w tle, żeby przejście do rankingu nie kończyło partii.
          Oba widoki dzielą jedno połączenie (pokój jest przypięty do sesji gry). Zmiana konta
          tworzy nowe połączenie i sesję (klucz), bo WebSocket czyta cookie przy połączeniu. */}
      {user !== undefined && (
        <ServerProvider key={user?.id ?? 'guest'} connect={connect}>
          <div className={styles.gameView} hidden={view !== 'game'}>
            <SoloGame active={view === 'game'} guest={user === null} />
            <p className={styles.controls}>{CONTROLS} · P pauza</p>
          </div>
          <div className={styles.gameView} hidden={view !== 'versus'}>
            <VersusView active={view === 'versus'} guest={user === null} />
            <p className={styles.controls}>{CONTROLS}</p>
          </div>
        </ServerProvider>
      )}
      <div hidden={view !== 'ranking'}>
        <LeaderboardView active={view === 'ranking'} />
      </div>
      <div hidden={view !== 'account'}>
        <AccountView active={view === 'account'} />
      </div>
      <div hidden={view !== 'admin'}>
        <AdminView active={view === 'admin'} />
      </div>
      {/* Trasy nie mają własnych elementów (widoki wyżej zostają zamontowane); tu tylko przekierowanie. */}
      <Outlet />
    </main>
  )
}

/**
 * Trasy widoków (spec fundament-repo). Widoki nie są elementami tras, bo gra i pokój zostają
 * zamontowane w tle; trasa wskazuje tylko, który widok pokazać (`handle`, czytany przez `useView`).
 */
const routes = (connect: ConnectFn | undefined): RouteObject[] => {
  const views = (Object.entries(PATHS) as [View, string][]).filter(([view]) => view !== 'game')
  return [
    {
      path: PATHS.game,
      element: <Shell connect={connect} />,
      children: [
        { index: true, handle: { view: 'game' } satisfies ViewHandle },
        ...views.map(([view, path]) => ({ path, handle: { view } satisfies ViewHandle })),
        { path: ROOM_PATH, handle: { view: 'versus' } satisfies ViewHandle },
        { path: '*', element: <Navigate to={PATHS.game} replace /> },
      ],
    },
  ]
}

export const App = ({ connect }: { connect?: ConnectFn }) => {
  const [router] = useState(() => {
    // Stare linki z hashem (`#/pokoj/<kod>`) zamieniamy na ścieżkę, zanim router przeczyta adres.
    const legacy = legacyHashPath(window.location.hash)
    if (legacy) {
      window.history.replaceState(null, '', legacy)
    }
    return createBrowserRouter(routes(connect))
  })

  return (
    <AccountProvider>
      <RouterProvider router={router} />
    </AccountProvider>
  )
}
