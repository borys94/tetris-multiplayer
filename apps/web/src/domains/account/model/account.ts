import { ApiError, api } from '../../../core/api/client'
import type { Account } from '../../../core/api/types'
import { Store } from '../../../core/store'

export interface AccountState {
  /** `undefined` dopóki nie wiemy, `null` dla gościa. */
  user: Account | null | undefined
}

/** Zalogowany gracz (spec konta): sprawdzenie sesji przy starcie, logowanie, rejestracja, wylogowanie. */
export class AccountStore extends Store<AccountState> {
  constructor() {
    super({ user: undefined })
  }

  /** Sprawdza sesję z cookie; 401 to gość, a przy błędzie sieci też pokazujemy grę jako gość. */
  async load(): Promise<void> {
    try {
      this.setState({ user: await api.me() })
    } catch (error) {
      this.setState({ user: null })
      if (!(error instanceof ApiError)) {
        console.warn('account check failed', error)
      }
    }
  }

  login = async (username: string, password: string): Promise<void> => {
    this.setState({ user: await api.login(username, password) })
  }

  register = async (username: string, password: string): Promise<void> => {
    this.setState({ user: await api.register(username, password) })
  }

  logout = async (): Promise<void> => {
    await api.logout()
    this.setState({ user: null })
  }
}
