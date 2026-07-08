import {
  CLEAR_DURATION_MS,
  finishClearing,
  getDropIntervalMs,
  getGhostPiece,
  tick,
  type GameState,
} from '../engine/game'
import { drawBoard } from './renderer'

export type GameLoopCallbacks = {
  onStateChange: (state: GameState) => void
  onLineClear?: () => void
  getState: () => GameState
  setState: (state: GameState) => void
  draw: (canvas: HTMLCanvasElement, flash?: number) => void
}

const MAX_FRAME_MS = 100

export const createGameLoop = (callbacks: GameLoopCallbacks) => {
  let rafId = 0
  let lastTime = 0
  let gravityAccumulator = 0
  let clearingStartTime: number | null = null
  let running = false

  const step = (time: number) => {
    if (!running) return

    const delta = lastTime === 0 ? 0 : Math.min(time - lastTime, MAX_FRAME_MS)
    lastTime = time

    const state = callbacks.getState()

    if (state.phase === 'clearing') {
      if (clearingStartTime === null) {
        clearingStartTime = time
        callbacks.onLineClear?.()
      }

      const elapsed = time - clearingStartTime
      const flash = Math.sin((elapsed / CLEAR_DURATION_MS) * Math.PI * 4) * 0.5 + 0.5

      if (elapsed >= CLEAR_DURATION_MS) {
        const next = finishClearing(state)
        clearingStartTime = null
        callbacks.setState(next)
        callbacks.onStateChange(next)
      }

      callbacks.draw(
        document.querySelector('canvas[data-board]') as HTMLCanvasElement,
        flash,
      )
    } else {
      clearingStartTime = null

      if (state.phase === 'playing' && state.active) {
        gravityAccumulator += delta
        const interval = getDropIntervalMs(state.level)
        let next = state

        while (gravityAccumulator >= interval) {
          next = tick(next)
          gravityAccumulator -= interval
        }

        if (next !== state) {
          callbacks.setState(next)
          callbacks.onStateChange(next)
        }
      }

      callbacks.draw(document.querySelector('canvas[data-board]') as HTMLCanvasElement)
    }

    rafId = requestAnimationFrame(step)
  }

  return {
    start: () => {
      if (running) return
      running = true
      lastTime = 0
      gravityAccumulator = 0
      clearingStartTime = null
      rafId = requestAnimationFrame(step)
    },
    stop: () => {
      running = false
      clearingStartTime = null
      cancelAnimationFrame(rafId)
    },
    resetGravity: () => {
      gravityAccumulator = 0
      clearingStartTime = null
    },
  }
}

export const renderGameBoard = (
  canvas: HTMLCanvasElement,
  state: GameState,
  cellSize: number,
  clearingFlash?: number,
) => {
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  drawBoard(ctx, {
    board: state.board,
    active: state.active,
    ghost: getGhostPiece(state),
    cellSize,
    clearingRows: state.clearingRows,
    clearingFlash,
  })
}
