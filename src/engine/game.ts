import { createBag, type Bag, type Rng } from './bag'
import {
  clearLines,
  collides,
  createEmptyBoard,
  createSpawnPiece,
  findFullRows,
  getGhostRow,
  placePiece,
  type Board,
} from './board'
import { type ActivePiece, type PieceKind } from './pieces'

export type GamePhase = 'playing' | 'paused' | 'clearing' | 'gameOver'

export type PendingClear = {
  scoreAdd: number
  lines: number
  level: number
}

export type GameState = {
  board: Board
  active: ActivePiece | null
  next: PieceKind
  bag: Bag
  score: number
  lines: number
  level: number
  phase: GamePhase
  clearingRows: number[] | null
  pendingClear: PendingClear | null
}

export const CLEAR_DURATION_MS = 250

const SCORE_TABLE = [0, 100, 300, 500, 800] as const

export const BASE_DROP_MS = 1000
export const MIN_DROP_MS = 200
export const LEVEL_SPEED_FACTOR = 0.9

export const getDropIntervalMs = (level: number) => {
  const interval = BASE_DROP_MS * LEVEL_SPEED_FACTOR ** (level - 1)
  return Math.max(MIN_DROP_MS, Math.round(interval))
}

export const getLevelFromLines = (lines: number) => Math.floor(lines / 10) + 1

export const spawnNextPiece = (state: GameState) => {
  const kind = state.bag.next()
  const next = state.bag.peek()
  const active = createSpawnPiece(kind)

  if (collides(state.board, active)) {
    return {
      ...state,
      active: null,
      next,
      phase: 'gameOver' as const,
    }
  }

  return {
    ...state,
    active,
    next,
    phase: 'playing' as const,
  }
}

export const createGame = (rng?: Rng) => {
  const bag = createBag(rng)
  const next = bag.peek()

  return {
    board: createEmptyBoard(),
    active: null,
    next,
    bag,
    score: 0,
    lines: 0,
    level: 1,
    phase: 'playing',
    clearingRows: null,
    pendingClear: null,
  } satisfies GameState
}

export const startGame = (rng?: Rng) => spawnNextPiece(createGame(rng))

const withActive = (state: GameState, updater: (piece: ActivePiece) => ActivePiece) => {
  if (!state.active || state.phase !== 'playing') {
    return state
  }

  const moved = updater(state.active)
  if (collides(state.board, moved)) {
    return state
  }

  return { ...state, active: moved }
}

export const moveLeft = (state: GameState) =>
  withActive(state, (piece) => ({ ...piece, x: piece.x - 1 }))

export const moveRight = (state: GameState) =>
  withActive(state, (piece) => ({ ...piece, x: piece.x + 1 }))

const WALL_KICKS = [-1, 1, -2, 2] as const

export const rotate = (state: GameState) => {
  if (!state.active || state.phase !== 'playing') {
    return state
  }

  const rotated = {
    ...state.active,
    rotation: state.active.rotation + 1,
  }

  if (!collides(state.board, rotated)) {
    return { ...state, active: rotated }
  }

  for (const offset of WALL_KICKS) {
    const kicked = { ...rotated, x: rotated.x + offset }
    if (!collides(state.board, kicked)) {
      return { ...state, active: kicked }
    }
  }

  return state
}

export const softDrop = (state: GameState) => {
  if (!state.active || state.phase !== 'playing') {
    return state
  }

  const dropped = { ...state.active, y: state.active.y + 1 }
  if (!collides(state.board, dropped)) {
    return { ...state, active: dropped }
  }

  return lockPiece(state)
}

export const tick = (state: GameState) => {
  if (!state.active || state.phase !== 'playing') {
    return state
  }

  const dropped = { ...state.active, y: state.active.y + 1 }
  if (!collides(state.board, dropped)) {
    return { ...state, active: dropped }
  }

  return lockPiece(state)
}

const lockPiece = (state: GameState) => {
  if (!state.active) {
    return state
  }

  const board = placePiece(state.board, state.active)
  const fullRows = findFullRows(board)

  if (fullRows.length === 0) {
    return spawnNextPiece({
      ...state,
      board,
      active: null,
    })
  }

  const cleared = fullRows.length
  const lines = state.lines + cleared
  const level = getLevelFromLines(lines)
  const scoreAdd = (SCORE_TABLE[cleared] ?? 0) * level

  return {
    ...state,
    board,
    active: null,
    phase: 'clearing' as const,
    clearingRows: fullRows,
    pendingClear: { scoreAdd, lines, level },
  }
}

export const finishClearing = (state: GameState) => {
  if (state.phase !== 'clearing' || !state.pendingClear) {
    return state
  }

  const { board: clearedBoard } = clearLines(state.board)
  const { scoreAdd, lines, level } = state.pendingClear

  return spawnNextPiece({
    ...state,
    board: clearedBoard,
    score: state.score + scoreAdd,
    lines,
    level,
    clearingRows: null,
    pendingClear: null,
  })
}

export const togglePause = (state: GameState) => {
  if (state.phase === 'gameOver' || state.phase === 'clearing') {
    return state
  }

  const phase = state.phase === 'paused' ? 'playing' : 'paused'
  return {
    ...state,
    phase,
  } satisfies GameState
}

export const getGhostPiece = (state: GameState) => {
  if (!state.active) {
    return null
  }

  return {
    ...state.active,
    y: getGhostRow(state.board, state.active),
  }
}

export const isGameOver = (state: GameState) => state.phase === 'gameOver'

export { BOARD_HEIGHT, BOARD_WIDTH } from './board'
