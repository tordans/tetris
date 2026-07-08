import {
  BOARD_HEIGHT,
  BOARD_WIDTH,
  type Board,
} from '../engine/board'
import {
  getPieceCells,
  PIECES,
  type ActivePiece,
  type PieceKind,
} from '../engine/pieces'

export type RenderOptions = {
  board: Board
  active: ActivePiece | null
  ghost: ActivePiece | null
  cellSize?: number
  padding?: number
  clearingRows?: number[] | null
  clearingFlash?: number
}

const GRID_COLOR = 'rgba(255, 255, 255, 0.06)'
const BOARD_BG = '#0f0f1a'
const GHOST_ALPHA = 0.25
const CELL_RADIUS = 4

export const getBoardPixelSize = (cellSize: number, padding = 0) => ({
  width: BOARD_WIDTH * cellSize + padding * 2,
  height: BOARD_HEIGHT * cellSize + padding * 2,
})

export const drawBoard = (
  ctx: CanvasRenderingContext2D,
  options: RenderOptions,
) => {
  const cellSize = options.cellSize ?? 24
  const padding = options.padding ?? 0
  const dpr = window.devicePixelRatio || 1
  const { width, height } = getBoardPixelSize(cellSize, padding)
  const clearingSet = new Set(options.clearingRows ?? [])
  const flash = options.clearingFlash ?? 0

  ctx.canvas.width = width * dpr
  ctx.canvas.height = height * dpr
  ctx.canvas.style.width = `${width}px`
  ctx.canvas.style.height = `${height}px`
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

  ctx.fillStyle = BOARD_BG
  ctx.fillRect(0, 0, width, height)

  for (let row = 0; row < BOARD_HEIGHT; row++) {
    for (let col = 0; col < BOARD_WIDTH; col++) {
      const x = padding + col * cellSize
      const y = padding + row * cellSize

      ctx.strokeStyle = GRID_COLOR
      ctx.strokeRect(x + 0.5, y + 0.5, cellSize - 1, cellSize - 1)

      const cell = options.board[row]![col]
      if (cell) {
        const isFlashing = clearingSet.has(row) && flash > 0.4
        drawCell(ctx, x, y, cellSize, isFlashing ? '#ffffff' : cell.color)
      }
    }
  }

  if (options.ghost) {
    drawPiece(ctx, options.ghost, cellSize, padding, GHOST_ALPHA)
  }

  if (options.active) {
    drawPiece(ctx, options.active, cellSize, padding, 1)
  }
}

const drawPiece = (
  ctx: CanvasRenderingContext2D,
  piece: ActivePiece,
  cellSize: number,
  padding: number,
  alpha: number,
) => {
  const color = PIECES[piece.kind].color
  ctx.globalAlpha = alpha

  for (const { x, y } of getPieceCells(piece)) {
    if (y < 0) continue
    drawCell(ctx, padding + x * cellSize, padding + y * cellSize, cellSize, color)
  }

  ctx.globalAlpha = 1
}

const drawCell = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  color: string,
) => {
  const inset = 2
  const w = size - inset * 2
  const h = size - inset * 2
  const cx = x + inset
  const cy = y + inset

  ctx.fillStyle = color
  ctx.beginPath()
  ctx.roundRect(cx, cy, w, h, CELL_RADIUS)
  ctx.fill()

  const grad = ctx.createLinearGradient(cx, cy, cx, cy + h)
  grad.addColorStop(0, 'rgba(255, 255, 255, 0.35)')
  grad.addColorStop(0.45, 'rgba(255, 255, 255, 0.06)')
  grad.addColorStop(1, 'rgba(0, 0, 0, 0.18)')
  ctx.fillStyle = grad
  ctx.beginPath()
  ctx.roundRect(cx, cy, w, h, CELL_RADIUS)
  ctx.fill()
}

export const drawPreviewPiece = (
  ctx: CanvasRenderingContext2D,
  kind: PieceKind,
  size: number,
) => {
  const dpr = window.devicePixelRatio || 1
  const canvasSize = size

  ctx.canvas.width = canvasSize * dpr
  ctx.canvas.height = canvasSize * dpr
  ctx.canvas.style.width = `${canvasSize}px`
  ctx.canvas.style.height = `${canvasSize}px`
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

  ctx.clearRect(0, 0, canvasSize, canvasSize)

  const shape = PIECES[kind].rotations[0]!
  const rows = shape.length
  const cols = shape[0]!.length
  const cellSize = Math.floor(Math.min(canvasSize / (cols + 1), canvasSize / (rows + 1)))
  const offsetX = Math.floor((canvasSize - cols * cellSize) / 2)
  const offsetY = Math.floor((canvasSize - rows * cellSize) / 2)
  const color = PIECES[kind].color

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      if (shape[row]![col]) {
        drawCell(ctx, offsetX + col * cellSize, offsetY + row * cellSize, cellSize, color)
      }
    }
  }
}
