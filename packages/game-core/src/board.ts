import { pieceCells, type Piece, type PieceType } from './pieces'

export const BOARD_WIDTH = 10
/** Widoczne wiersze. */
export const BOARD_HEIGHT = 20
/** Ukryte wiersze nad planszą, w których pojawiają się nowe klocki. */
export const HIDDEN_ROWS = 2
export const TOTAL_ROWS = BOARD_HEIGHT + HIDDEN_ROWS

/** Komórka planszy: klocek, linia śmieci (`G`, spec silnik-gry) albo pusta. */
export type Cell = PieceType | 'G' | null
export type Board = readonly (readonly Cell[])[]

const emptyRow = (): Cell[] => {
  return Array.from({ length: BOARD_WIDTH }, () => null)
}

export const createEmptyBoard = (): Board => {
  return Array.from({ length: TOTAL_ROWS }, emptyRow)
}

export const isOccupied = (board: Board, x: number, y: number): boolean => {
  if (x < 0 || x >= BOARD_WIDTH || y >= TOTAL_ROWS) {
    return true
  }
  if (y < 0) {
    return false
  }
  return (board[y]?.[x] ?? null) !== null
}

export const collides = (board: Board, piece: Piece): boolean => {
  return pieceCells(piece).some(({ x, y }) => isOccupied(board, x, y))
}

export const lockPiece = (board: Board, piece: Piece): Board => {
  const rows = board.map((row) => [...row])
  for (const { x, y } of pieceCells(piece)) {
    const row = rows[y]
    if (row) {
      row[x] = piece.type
    }
  }
  return rows
}

export const clearLines = (board: Board): { board: Board; cleared: number } => {
  const remaining = board.filter((row) => row.some((cell) => cell === null))
  const cleared = board.length - remaining.length
  if (cleared === 0) {
    return { board, cleared }
  }
  return { board: [...Array.from({ length: cleared }, emptyRow), ...remaining], cleared }
}

export const dropDistance = (board: Board, piece: Piece): number => {
  let distance = 0
  while (!collides(board, { ...piece, y: piece.y + distance + 1 })) {
    distance++
  }
  return distance
}
