export type View = 'game' | 'versus' | 'ranking' | 'account' | 'admin'

/** Ścieżki widoków (spec fundament-repo); trasy React Routera składa `app/App`. */
export const PATHS: Readonly<Record<View, string>> = {
  game: '/',
  versus: '/1v1',
  ranking: '/ranking',
  account: '/konto',
  admin: '/admin',
}

/** Link do pokoju (`/pokoj/<kod>`) otwiera widok 1v1 i dołącza do pokoju. */
export const ROOM_PATH = '/pokoj/:code'

/** Poprawny kod pokoju. */
export const ROOM_CODE = /^[A-Za-z0-9]{6}$/

/** Link do pokoju dla przeciwnika. */
export const roomLink = (code: string): string => {
  return `${window.location.origin}/pokoj/${code}`
}

/**
 * Ścieżka ze starego linku z hashem (`#/pokoj/<kod>`, `#/ranking`), żeby wysłane wcześniej
 * linki dalej działały; `null`, gdy hash nie jest takim linkiem.
 */
export const legacyHashPath = (hash: string): string | null => {
  return hash.startsWith('#/') ? hash.slice(1) : null
}
