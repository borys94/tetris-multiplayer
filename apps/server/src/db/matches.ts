import type { MatchEndReason } from '@tetris/protocol'
import { LIST_LIMIT, type Queryable } from './pool'

export interface MatchPlayerRecord {
  userId: number | null
  name: string
  linesSent: number
}

export interface MatchRecord {
  winner: MatchPlayerRecord
  loser: MatchPlayerRecord
  reason: MatchEndReason
  ticks: number
}

export interface SavedMatch {
  id: number
  winnerId: number | null
  winnerName: string
  loserId: number | null
  loserName: string
  reason: MatchEndReason
  winnerLinesSent: number
  loserLinesSent: number
  ticks: number
  endedAt: Date
}

/** Mecz z punktu widzenia gracza (historia, R5). */
export interface PlayerMatch {
  id: number
  won: boolean
  opponent: string
  reason: MatchEndReason
  linesSent: number
  linesReceived: number
  ticks: number
  endedAt: Date
}

const COLUMNS = `id, winner_id as "winnerId", winner_name as "winnerName", loser_id as "loserId",
  loser_name as "loserName", reason, winner_lines_sent as "winnerLinesSent",
  loser_lines_sent as "loserLinesSent", ticks, ended_at as "endedAt"`

export const insertMatch = async (db: Queryable, match: MatchRecord): Promise<number> => {
  const { winner, loser } = match
  const { rows } = await db.query<{ id: number }>(
    `insert into matches (winner_id, winner_name, loser_id, loser_name, reason,
       winner_lines_sent, loser_lines_sent, ticks)
     values ($1, $2, $3, $4, $5, $6, $7, $8) returning id`,
    [
      winner.userId,
      winner.name,
      loser.userId,
      loser.name,
      match.reason,
      winner.linesSent,
      loser.linesSent,
      match.ticks,
    ],
  )
  return rows[0]!.id
}

/** Ostatnie mecze gracza, od najnowszego. */
export const userMatches = async (db: Queryable, userId: number): Promise<PlayerMatch[]> => {
  const { rows } = await db.query<SavedMatch>(
    `select ${COLUMNS} from matches where winner_id = $1 or loser_id = $1
     order by id desc limit $2`,
    [userId, LIST_LIMIT],
  )
  return rows.map((m) => {
    const won = m.winnerId === userId
    return {
      id: m.id,
      won,
      opponent: won ? m.loserName : m.winnerName,
      reason: m.reason,
      linesSent: won ? m.winnerLinesSent : m.loserLinesSent,
      linesReceived: won ? m.loserLinesSent : m.winnerLinesSent,
      ticks: m.ticks,
      endedAt: m.endedAt,
    }
  })
}

/**
 * Wszystkie mecze dla admina, od najnowszego, po `LIST_LIMIT`: `before` to id ostatniego
 * meczu z poprzedniej strony, `query` filtruje po fragmencie nazwy gracza.
 */
export const listMatches = async (
  db: Queryable,
  { query = '', before }: { query?: string; before?: number } = {},
): Promise<SavedMatch[]> => {
  const pattern = `%${query.replace(/[\\%_]/g, (c) => `\\${c}`)}%`
  const { rows } = await db.query<SavedMatch>(
    `select ${COLUMNS} from matches
     where ($1 = '%%' or winner_name ilike $1 or loser_name ilike $1)
       and ($2::bigint is null or id < $2)
     order by id desc limit $3`,
    [pattern, before ?? null, LIST_LIMIT],
  )
  return rows
}
