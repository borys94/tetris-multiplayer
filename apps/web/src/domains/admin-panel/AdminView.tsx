import { useState } from 'react'
import { Page, Tabs } from '../../ui'
import { useAccount } from '../account/use-account'
import { MatchesPanel } from './MatchesPanel'
import { RoomsPanel } from './RoomsPanel'
import { UsersPanel } from './UsersPanel'

type Tab = 'users' | 'rooms' | 'matches'

const TABS: readonly { id: Tab; label: string }[] = [
  { id: 'users', label: 'Konta' },
  { id: 'rooms', label: 'Pokoje' },
  { id: 'matches', label: 'Mecze 1v1' },
]

/**
 * Panel admina: konta, wyniki, pokoje i mecze 1v1 (spec panel-admina).
 * Widoczny tylko dla roli admin; uprawnienia i tak sprawdza serwer.
 */
export const AdminView = ({ active }: { active: boolean }) => {
  const { user } = useAccount()
  const [tab, setTab] = useState<Tab>('users')
  if (user?.role !== 'admin') {
    return null
  }

  return (
    <Page>
      <Tabs tabs={TABS} selected={tab} onSelect={setTab} label="Panel admina" />
      {tab === 'users' && <UsersPanel active={active} />}
      {tab === 'rooms' && <RoomsPanel active={active} />}
      {tab === 'matches' && <MatchesPanel active={active} />}
    </Page>
  )
}
