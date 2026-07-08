import {
  getPieceCells,
  PIECES,
  type ActivePiece,
  type Cell,
  type PieceKind,
} from './pieces'

export const BOARD_WIDTH = 10
export const BOARD_HEIGHT = 20

export type Board = (Cell | null)[][]

export const createEmptyBoard = () =>
  Array.from({ length: BOARD_HEIGHT }, () =>
    Array.from({ length: BOARD_WIDTH }, () => null),
  ) satisfies Board

export const collides = (board: Board, piece: ActivePiece) => {
  for (const { x, y } of getPieceCells(piece)) {
    if (x < 0 || x >= BOARD_WIDTH || y >= BOARD_HEIGHT) {
      return true
    }
    if (y >= 0 && board[y]![x] !== null) {
      return true
    }
  }
  return false
}

export const placePiece = (board: Board, piece: ActivePiece) => {
  const next = board.map((row) => row.map((cell) => cell)) satisfies Board
  const color = PIECES[piece.kind].color

  for (const { x, y } of getPieceCells(piece)) {
    if (y >= 0 && y < BOARD_HEIGHT && x >= 0 && x < BOARD_WIDTH) {
      next[y]![x] = { kind: piece.kind, color }
    }
  }

  return next
}

export const findFullRows = (board: Board) => {
  const rows: number[] = []
  for (let row = 0; row < BOARD_HEIGHT; row++) {
    if (board[row]!.every((cell) => cell !== null)) {
      rows.push(row)
    }
  }
  return rows
}

export const clearLines = (board: Board) => {
  const remaining: Board = []
  let cleared = 0

  for (const row of board) {
    if (row.every((cell) => cell !== null)) {
      cleared++
    } else {
      remaining.push(row)
    }
  }

  while (remaining.length < BOARD_HEIGHT) {
    remaining.unshift(
      Array.from({ length: BOARD_WIDTH }, () => null),
    )
  }

  return { board: remaining, cleared }
}

export const getGhostRow = (board: Board, piece: ActivePiece) => {
  let ghost = { ...piece }

  while (!collides(board, { ...ghost, y: ghost.y + 1 })) {
    ghost = { ...ghost, y: ghost.y + 1 }
  }

  return ghost.y
}

export const createSpawnPiece = (kind: PieceKind) =>
  ({
    kind,
    rotation: 0,
    x: Math.floor(BOARD_WIDTH / 2) - 2,
    y: -1,
  }) satisfies ActivePiece
