import { transaction, type Db } from '../db/pool'
import { deleteUserSessions } from '../db/sessions'
import {
  findUserById,
  setDisabled,
  setPasswordHash,
  setRole,
  type Role,
  type User,
} from '../db/users'
import { hashPassword, temporaryPassword } from './passwords'

/** Zmiany konta z panelu admina (spec panel-admina, R2). */
export interface UserChanges {
  role?: Role | null
  disabled?: boolean
}

export type UpdateUserError = 'not_found' | 'cannot_change_self'

/**
 * Zmienia rolę i/lub blokadę konta w jednej transakcji. Admin nie może odebrać sobie roli
 * ani zablokować siebie; blokada wylogowuje konto ze wszystkich urządzeń.
 */
export const updateUser = async (
  db: Db,
  actorId: number,
  id: number,
  changes: UserChanges,
): Promise<User | UpdateUserError> => {
  if (id === actorId && (changes.role === null || changes.disabled === true)) {
    return 'cannot_change_self'
  }
  return transaction(db, async (tx) => {
    if (!(await findUserById(tx, id))) {
      return 'not_found'
    }
    if (changes.role !== undefined) {
      await setRole(tx, id, changes.role)
    }
    if (changes.disabled !== undefined) {
      await setDisabled(tx, id, changes.disabled)
      if (changes.disabled) {
        await deleteUserSessions(tx, id)
      }
    }
    return (await findUserById(tx, id))!
  })
}

/**
 * Ustawia losowe hasło tymczasowe i wylogowuje konto ze wszystkich urządzeń (stare hasło
 * mogło wyciec). Zwraca hasło do pokazania adminowi albo `null`, gdy konta nie ma.
 */
export const resetPassword = async (db: Db, id: number): Promise<string | null> => {
  const password = temporaryPassword()
  // Hashowanie trwa; liczymy je przed transakcją, żeby nie trzymać połączenia z puli.
  const hash = await hashPassword(password)
  return transaction(db, async (tx) => {
    if (!(await setPasswordHash(tx, id, hash))) {
      return null
    }
    await deleteUserSessions(tx, id)
    return password
  })
}
