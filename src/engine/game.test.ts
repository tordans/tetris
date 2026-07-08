import { describe, expect, test } from 'bun:test'
import { createSeededRng } from './bag'
import { BOARD_WIDTH, createEmptyBoard, placePiece } from './board'
import {
  createGame,
  finishClearing,
  getDropIntervalMs,
  getGhostPiece,
  getLevelFromLines,
  isGameOver,
  moveLeft,
  moveRight,
  rotate,
  softDrop,
  spawnNextPiece,
  startGame,
  tick,
  togglePause,
} from './game'

const CELL = { kind: 'I' as const, color: '#00e5ff', pieceId: 1 }

const fillRow = (board: ReturnType<typeof createEmptyBoard>, row: number) => {
  const next = board.map((r) => r.map((c) => c))
  for (let x = 0; x < BOARD_WIDTH; x++) {
    next[row]![x] = CELL
  }
  return next
}

const fillRowExcept = (
  board: ReturnType<typeof createEmptyBoard>,
  row: number,
  except: number[],
) => {
  const next = board.map((r) => r.map((c) => c))
  for (let x = 0; x < BOARD_WIDTH; x++) {
    if (!except.includes(x)) {
      next[row]![x] = CELL
    }
  }
  return next
}

const lockAndFinish = (state: ReturnType<typeof startGame>) => {
  const locked = softDrop(state)
  return locked.phase === 'clearing' ? finishClearing(locked) : locked
}

describe('game state machine', () => {
  test('startGame spawns an active piece', () => {
    const state = startGame(createSeededRng(5))
    expect(state.active).not.toBeNull()
    expect(state.phase).toBe('playing')
    expect(state.score).toBe(0)
    expect(state.level).toBe(1)
  })

  test('moveLeft and moveRight shift piece', () => {
    let state = startGame(createSeededRng(2))
    const x = state.active!.x
    state = moveRight(state)
    expect(state.active!.x).toBe(x + 1)
    state = moveLeft(state)
    state = moveLeft(state)
    expect(state.active!.x).toBe(x - 1)
  })

  test('wall kick shifts piece when rotation would collide at wall', () => {
    let state = startGame(createSeededRng(3))
    state = {
      ...state,
      active: { kind: 'J', rotation: 0, x: 8, y: 5, pieceId: 1 },
    }
    const rotated = rotate(state)
    expect(rotated.active!.rotation).toBe(1)
    expect(rotated.active!.x).toBe(7)
    expect(rotated.active!.y).toBe(5)
  })

  test('blocked rotation leaves state unchanged', () => {
    const state = {
      ...startGame(createSeededRng(1)),
      board: createEmptyBoard(),
      active: { kind: 'I', rotation: 0, x: 0, y: 17, pieceId: 1 },
    }
    const result = rotate(state)
    expect(result).toEqual(state)
  })

  test('softDrop moves piece down or locks', () => {
    const state = startGame(createSeededRng(4))
    const y = state.active!.y
    const dropped = softDrop(state)
    expect(dropped.active === null || dropped.active.y >= y).toBe(true)
  })

  test('tick applies gravity like softDrop', () => {
    const state = startGame(createSeededRng(6))
    const y = state.active!.y
    const after = tick(state)
    expect(after.active === null || after.active.y >= y).toBe(true)
  })

  test('line clear enters clearing phase before scoring', () => {
    let state = startGame(createSeededRng(10))
    state = {
      ...state,
      active: { kind: 'O', rotation: 0, x: 4, y: 18, pieceId: 1 },
      board: fillRow(createEmptyBoard(), 19),
    }
    state = softDrop(state)
    expect(state.phase).toBe('clearing')
    expect(state.clearingRows).toEqual([19])
    expect(state.score).toBe(0)
    state = finishClearing(state)
    expect(state.score).toBe(100)
    expect(state.lines).toBe(1)
    expect(state.phase).toBe('playing')
  })

  test('2-line clear scores 300 × level', () => {
    let board = fillRowExcept(createEmptyBoard(), 18, [4, 5])
    board = fillRowExcept(board, 19, [4, 5])
    let state = startGame(createSeededRng(10))
    state = {
      ...state,
      level: 1,
      board,
      active: { kind: 'O', rotation: 0, x: 4, y: 18, pieceId: 1 },
    }
    state = lockAndFinish(state)
    expect(state.score).toBe(300)
    expect(state.lines).toBe(2)
  })

  test('3-line clear scores 500 × level', () => {
    let board = fillRow(createEmptyBoard(), 17)
    board = fillRow(board, 18)
    board = fillRowExcept(board, 19, [0, 1, 2, 3])
    let state = startGame(createSeededRng(10))
    state = {
      ...state,
      level: 1,
      board,
      active: { kind: 'I', rotation: 0, x: 0, y: 18, pieceId: 1 },
    }
    state = lockAndFinish(state)
    expect(state.score).toBe(500)
    expect(state.lines).toBe(3)
  })

  test('4-line clear scores 800 × level', () => {
    let board = fillRow(createEmptyBoard(), 16)
    board = fillRow(board, 17)
    board = fillRow(board, 18)
    board = fillRowExcept(board, 19, [0, 1, 2, 3])
    let state = startGame(createSeededRng(10))
    state = {
      ...state,
      lines: 6,
      level: 2,
      board,
      active: { kind: 'I', rotation: 0, x: 0, y: 18, pieceId: 1 },
    }
    state = lockAndFinish(state)
    expect(state.score).toBe(1600)
    expect(state.lines).toBe(10)
    expect(state.level).toBe(2)
  })

  test('scoring awards points scaled by level', () => {
    let state = startGame(createSeededRng(10))
    state = {
      ...state,
      lines: 10,
      level: 2,
      active: { kind: 'O', rotation: 0, x: 4, y: 18, pieceId: 1 },
      board: fillRow(createEmptyBoard(), 19),
    }
    state = lockAndFinish(state)
    expect(state.score).toBe(200)
    expect(state.lines).toBe(11)
    expect(state.level).toBe(2)
  })

  test('level increases every 10 lines', () => {
    expect(getLevelFromLines(0)).toBe(1)
    expect(getLevelFromLines(9)).toBe(1)
    expect(getLevelFromLines(10)).toBe(2)
    expect(getLevelFromLines(25)).toBe(3)
  })

  test('drop interval slows at level 1 and speeds up per level', () => {
    expect(getDropIntervalMs(1)).toBe(1000)
    expect(getDropIntervalMs(2)).toBe(900)
    expect(getDropIntervalMs(10)).toBeGreaterThanOrEqual(200)
    expect(getDropIntervalMs(100)).toBe(200)
  })

  test('game over when spawn collides', () => {
    let board = createEmptyBoard()
    for (let y = 0; y < 4; y++) {
      board = fillRow(board, y)
    }
    const state = spawnNextPiece({
      ...createGame(createSeededRng(1)),
      board,
      active: null,
    })
    expect(isGameOver(state)).toBe(true)
    expect(state.active).toBeNull()
  })

  test('ghost piece lands on stacked cells', () => {
    let board = createEmptyBoard()
    board = placePiece(board, { kind: 'O', rotation: 0, x: 4, y: 12, pieceId: 1 })
    const state = {
      ...startGame(createSeededRng(8)),
      board,
      active: { kind: 'O', rotation: 0, x: 4, y: 0, pieceId: 2 },
    }
    const ghost = getGhostPiece(state)
    expect(ghost).not.toBeNull()
    expect(ghost!.y).toBe(10)
    expect(ghost!.y).toBeGreaterThan(state.active!.y)
  })

  test('togglePause is a no-op during clearing phase', () => {
    let state = startGame(createSeededRng(10))
    state = {
      ...state,
      active: { kind: 'O', rotation: 0, x: 4, y: 18, pieceId: 1 },
      board: fillRow(createEmptyBoard(), 19),
    }
    state = softDrop(state)
    expect(state.phase).toBe('clearing')
    expect(state.clearingRows).toEqual([19])
    expect(state.pendingClear).not.toBeNull()

    const paused = togglePause(state)
    expect(paused).toBe(state)
    expect(paused.phase).toBe('clearing')
    expect(paused.clearingRows).toEqual([19])
    expect(paused.pendingClear).toEqual(state.pendingClear)

    const resumed = togglePause(paused)
    expect(resumed).toBe(paused)
    expect(resumed.phase).toBe('clearing')
  })
})
