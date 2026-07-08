import { describe, expect, test } from 'bun:test'
import {
  BOARD_WIDTH,
  clearLines,
  collides,
  createEmptyBoard,
  createSpawnPiece,
  getGhostRow,
  placePiece,
} from './board'

describe('board', () => {
  test('spawn piece starts above visible board', () => {
    const piece = createSpawnPiece('T')
    expect(piece.y).toBeLessThan(0)
    expect(collides(createEmptyBoard(), piece)).toBe(false)
  })

  test('detects collision with floor', () => {
    const board = createEmptyBoard()
    const piece = { kind: 'O' as const, rotation: 0, x: 4, y: 19, pieceId: 1 }
    expect(collides(board, piece)).toBe(true)
  })

  test('detects collision with placed cells', () => {
    let board = createEmptyBoard()
    board = placePiece(board, { kind: 'O', rotation: 0, x: 4, y: 17, pieceId: 1 })
    const piece = { kind: 'I', rotation: 0, x: 4, y: 16, pieceId: 2 }
    expect(collides(board, piece)).toBe(true)
  })

  test('placePiece writes cells to board', () => {
    const board = placePiece(createEmptyBoard(), {
      kind: 'O',
      rotation: 0,
      x: 4,
      y: 18,
      pieceId: 1,
    })
    expect(board[18]![4]).not.toBeNull()
    expect(board[19]![5]).not.toBeNull()
  })

  test('clearLines removes a single full row', () => {
    let board = createEmptyBoard()
    for (let x = 0; x < BOARD_WIDTH; x++) {
      board[19]![x] = { kind: 'I', color: '#00e5ff', pieceId: 1 }
    }
    const result = clearLines(board)
    expect(result.cleared).toBe(1)
    expect(result.board[19]!.every((c) => c === null)).toBe(true)
  })

  test('clearLines handles multiple rows at once', () => {
    let board = createEmptyBoard()
    for (const row of [18, 19]) {
      for (let x = 0; x < BOARD_WIDTH; x++) {
        board[row]![x] = { kind: 'I', color: '#00e5ff', pieceId: 1 }
      }
    }
    const result = clearLines(board)
    expect(result.cleared).toBe(2)
    expect(result.board[18]!.every((c) => c === null)).toBe(true)
    expect(result.board[19]!.every((c) => c === null)).toBe(true)
  })

  test('ghost row lands on floor or stacked cells', () => {
    const board = createEmptyBoard()
    const piece = { kind: 'O' as const, rotation: 0, x: 4, y: 0, pieceId: 2 }
    expect(getGhostRow(board, piece)).toBe(18)

    const stacked = placePiece(board, { kind: 'O', rotation: 0, x: 4, y: 17, pieceId: 1 })
    expect(getGhostRow(stacked, piece)).toBe(15)
  })
})
