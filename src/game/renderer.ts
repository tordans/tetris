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
  showGhost?: boolean
}

const GRID_COLOR = 'rgba(255, 255, 255, 0.06)'
const BOARD_BG = '#0f0f1a'
const GHOST_ALPHA = 0.25
const CELL_RADIUS = 4
const CELL_INSET = 2

type Neighbors = {
  left: boolean
  right: boolean
  top: boolean
  bottom: boolean
}

export const getBoardPixelSize = (cellSize: number, padding = 0) => ({
  width: BOARD_WIDTH * cellSize + padding * 2,
  height: BOARD_HEIGHT * cellSize + padding * 2,
})

const cellKey = (x: number, y: number) => `${x},${y}`

const buildPieceCellSet = (piece: ActivePiece) => {
  const cells = new Set<string>()
  for (const { x, y } of getPieceCells(piece)) {
    cells.add(cellKey(x, y))
  }
  return cells
}

const getPieceNeighbors = (cells: Set<string>, x: number, y: number): Neighbors => ({
  left: cells.has(cellKey(x - 1, y)),
  right: cells.has(cellKey(x + 1, y)),
  top: cells.has(cellKey(x, y - 1)),
  bottom: cells.has(cellKey(x, y + 1)),
})

const getBoardNeighbors = (
  board: Board,
  row: number,
  col: number,
  pieceId: number,
): Neighbors => {
  const samePiece = (r: number, c: number) => board[r]?.[c]?.pieceId === pieceId

  return {
    left: col > 0 && samePiece(row, col - 1),
    right: col < BOARD_WIDTH - 1 && samePiece(row, col + 1),
    top: row > 0 && samePiece(row - 1, col),
    bottom: row < BOARD_HEIGHT - 1 && samePiece(row + 1, col),
  }
}

const drawMergedCell = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  color: string,
  neighbors: Neighbors,
) => {
  const left = x + (neighbors.left ? 0 : CELL_INSET)
  const top = y + (neighbors.top ? 0 : CELL_INSET)
  const right = x + size - (neighbors.right ? 0 : CELL_INSET)
  const bottom = y + size - (neighbors.bottom ? 0 : CELL_INSET)
  const w = right - left
  const h = bottom - top

  const radii: [number, number, number, number] = [
    neighbors.top || neighbors.left ? 0 : CELL_RADIUS,
    neighbors.top || neighbors.right ? 0 : CELL_RADIUS,
    neighbors.bottom || neighbors.right ? 0 : CELL_RADIUS,
    neighbors.bottom || neighbors.left ? 0 : CELL_RADIUS,
  ]

  ctx.fillStyle = color
  ctx.beginPath()
  ctx.roundRect(left, top, w, h, radii)
  ctx.fill()

  const grad = ctx.createLinearGradient(left, top, left, bottom)
  grad.addColorStop(0, 'rgba(255, 255, 255, 0.35)')
  grad.addColorStop(0.45, 'rgba(255, 255, 255, 0.06)')
  grad.addColorStop(1, 'rgba(0, 0, 0, 0.18)')
  ctx.fillStyle = grad
  ctx.beginPath()
  ctx.roundRect(left, top, w, h, radii)
  ctx.fill()
}

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
    }
  }

  for (let row = 0; row < BOARD_HEIGHT; row++) {
    for (let col = 0; col < BOARD_WIDTH; col++) {
      const cell = options.board[row]![col]
      if (!cell) continue

      const x = padding + col * cellSize
      const y = padding + row * cellSize
      const isFlashing = clearingSet.has(row) && flash > 0.4
      const color = isFlashing ? '#ffffff' : cell.color
      const neighbors = getBoardNeighbors(options.board, row, col, cell.pieceId)
      drawMergedCell(ctx, x, y, cellSize, color, neighbors)
    }
  }

  if (options.showGhost !== false && options.ghost) {
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
  const cells = buildPieceCellSet(piece)
  ctx.globalAlpha = alpha

  for (const { x, y } of getPieceCells(piece)) {
    if (y < 0) continue
    const neighbors = getPieceNeighbors(cells, x, y)
    drawMergedCell(
      ctx,
      padding + x * cellSize,
      padding + y * cellSize,
      cellSize,
      color,
      neighbors,
    )
  }

  ctx.globalAlpha = 1
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

  const cells = new Set<string>()
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      if (shape[row]![col]) {
        cells.add(cellKey(col, row))
      }
    }
  }

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      if (!shape[row]![col]) continue
      const neighbors = getPieceNeighbors(cells, col, row)
      drawMergedCell(
        ctx,
        offsetX + col * cellSize,
        offsetY + row * cellSize,
        cellSize,
        color,
        neighbors,
      )
    }
  }
}
