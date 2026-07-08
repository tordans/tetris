export type PieceKind = 'I' | 'O' | 'T' | 'S' | 'Z' | 'J' | 'L'

export type Cell = {
  kind: PieceKind
  color: string
}

export type PieceShape = readonly (readonly number[])[]

export type PieceDefinition = {
  kind: PieceKind
  color: string
  rotations: readonly PieceShape[]
}

const I_ROTATIONS = [
  [[0, 0, 0, 0], [1, 1, 1, 1], [0, 0, 0, 0], [0, 0, 0, 0]],
  [[0, 0, 1, 0], [0, 0, 1, 0], [0, 0, 1, 0], [0, 0, 1, 0]],
  [[0, 0, 0, 0], [0, 0, 0, 0], [1, 1, 1, 1], [0, 0, 0, 0]],
  [[0, 1, 0, 0], [0, 1, 0, 0], [0, 1, 0, 0], [0, 1, 0, 0]],
] as const satisfies readonly PieceShape[]

const O_ROTATIONS = [
  [[1, 1], [1, 1]],
  [[1, 1], [1, 1]],
  [[1, 1], [1, 1]],
  [[1, 1], [1, 1]],
] as const satisfies readonly PieceShape[]

const T_ROTATIONS = [
  [[0, 1, 0], [1, 1, 1], [0, 0, 0]],
  [[0, 1, 0], [0, 1, 1], [0, 1, 0]],
  [[0, 0, 0], [1, 1, 1], [0, 1, 0]],
  [[0, 1, 0], [1, 1, 0], [0, 1, 0]],
] as const satisfies readonly PieceShape[]

const S_ROTATIONS = [
  [[0, 1, 1], [1, 1, 0], [0, 0, 0]],
  [[0, 1, 0], [0, 1, 1], [0, 0, 1]],
  [[0, 0, 0], [0, 1, 1], [1, 1, 0]],
  [[1, 0, 0], [1, 1, 0], [0, 1, 0]],
] as const satisfies readonly PieceShape[]

const Z_ROTATIONS = [
  [[1, 1, 0], [0, 1, 1], [0, 0, 0]],
  [[0, 0, 1], [0, 1, 1], [0, 1, 0]],
  [[0, 0, 0], [1, 1, 0], [0, 1, 1]],
  [[0, 1, 0], [1, 1, 0], [1, 0, 0]],
] as const satisfies readonly PieceShape[]

const J_ROTATIONS = [
  [[1, 0, 0], [1, 1, 1], [0, 0, 0]],
  [[0, 1, 1], [0, 1, 0], [0, 1, 0]],
  [[0, 0, 0], [1, 1, 1], [0, 0, 1]],
  [[0, 1, 0], [0, 1, 0], [1, 1, 0]],
] as const satisfies readonly PieceShape[]

const L_ROTATIONS = [
  [[0, 0, 1], [1, 1, 1], [0, 0, 0]],
  [[0, 1, 0], [0, 1, 0], [0, 1, 1]],
  [[0, 0, 0], [1, 1, 1], [1, 0, 0]],
  [[1, 1, 0], [0, 1, 0], [0, 1, 0]],
] as const satisfies readonly PieceShape[]

export const PIECES = {
  I: { kind: 'I', color: '#00e5ff', rotations: I_ROTATIONS },
  O: { kind: 'O', color: '#ffea00', rotations: O_ROTATIONS },
  T: { kind: 'T', color: '#d500f9', rotations: T_ROTATIONS },
  S: { kind: 'S', color: '#00e676', rotations: S_ROTATIONS },
  Z: { kind: 'Z', color: '#ff1744', rotations: Z_ROTATIONS },
  J: { kind: 'J', color: '#2979ff', rotations: J_ROTATIONS },
  L: { kind: 'L', color: '#ff9100', rotations: L_ROTATIONS },
} as const satisfies Record<PieceKind, PieceDefinition>

export const PIECE_KINDS = Object.keys(PIECES) as PieceKind[]

export type ActivePiece = {
  kind: PieceKind
  rotation: number
  x: number
  y: number
}

export const getPieceShape = (piece: ActivePiece) => {
  const def = PIECES[piece.kind]
  return def.rotations[piece.rotation % def.rotations.length]!
}

export const getPieceCells = (piece: ActivePiece) => {
  const shape = getPieceShape(piece)
  const cells: { x: number; y: number }[] = []

  for (let row = 0; row < shape.length; row++) {
    const rowData = shape[row]!
    for (let col = 0; col < rowData.length; col++) {
      if (rowData[col]) {
        cells.push({ x: piece.x + col, y: piece.y + row })
      }
    }
  }

  return cells
}
