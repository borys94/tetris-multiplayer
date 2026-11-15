import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { Account } from '../../core/api/types'
import { AccountStore } from './model/account'
import { useStore } from '../../hooks/store'

interface AccountApi {
  /** `undefined` dopóki nie wiemy, `null` dla gościa. */
  user: Account | null | undefined
  login: AccountStore['login']
  register: AccountStore['register']
  logout: AccountStore['logout']
}

const AccountContext = createContext<AccountStore | null>(null)

export const AccountProvider = ({ children }: { children: ReactNode }) => {
  const [store] = useState(() => new AccountStore())
  useEffect(() => void store.load(), [store])
  return <AccountContext.Provider value={store}>{children}</AccountContext.Provider>
}

export const useAccount = (): AccountApi => {
  const store = useContext(AccountContext)
  if (!store) {
    throw new Error('useAccount wymaga AccountProvider')
  }
  const { user } = useStore(store)
  return { user, login: store.login, register: store.register, logout: store.logout }
}
