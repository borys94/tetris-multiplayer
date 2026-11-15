import type { GameResult } from '../game/session'
import { LIST_LIMIT, type Queryable } from './pool'

export interface SavedGame extends GameResult {
  id: number
  endedAt: Date
}

export interface LeaderboardEntry {
  rank: number
  /** Id gry (np. do usunięcia wyniku przez admina). */
  gameId: number
  username: string
  score: number
  lines: number
  level: number
  endedAt: Date
}

export const insertGame = async (
  db: Queryable,
  userId: number,
  result: GameResult,
): Promise<number> => {
  const { rows } = await db.query<{ id: number }>(
    'insert into games (user_id, score, lines, level, ticks) values ($1, $2, $3, $4, $5) returning id',
    [userId, result.score, result.lines, result.level, result.ticks],
  )
  return rows[0]!.id
}

/** Ostatnie gry gracza, od najnowszej. */
export const userGames = async (db: Queryable, userId: number): Promise<SavedGame[]> => {
  const { rows } = await db.query<SavedGame>(
    `select id, score, lines, level, ticks, ended_at as "endedAt"
     from games where user_id = $1 order by ended_at desc, id desc limit $2`,
    [userId, LIST_LIMIT],
  )
  return rows
}

/**
 * Ranking: najlepsza gra każdego niezablokowanego gracza; przy remisie wyżej
 * jest wynik osiągnięty wcześniej.
 */
export const leaderboard = async (db: Queryable): Promise<LeaderboardEntry[]> => {
  const { rows } = await db.query<Omit<LeaderboardEntry, 'rank'>>(
    `select id as "gameId", username, score, lines, level, "endedAt" from (
       select distinct on (g.user_id) u.username, g.score, g.lines, g.level, g.ended_at as "endedAt", g.id
       from games g join users u on u.id = g.user_id
       where u.disabled_at is null
       order by g.user_id, g.score desc, g.ended_at asc, g.id asc
     ) best
     order by score desc, "endedAt" asc, id asc
     limit $1`,
    [LIST_LIMIT],
  )
  return rows.map((row, index) => ({ rank: index + 1, ...row }))
}

export const deleteGame = async (db: Queryable, id: number): Promise<boolean> => {
  const { rowCount } = await db.query('delete from games where id = $1', [id])
  return rowCount === 1
}
