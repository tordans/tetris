import { PIECE_KINDS, type PieceKind } from './pieces'

export type Rng = () => number

export const defaultRng = () => Math.random()

export const createSeededRng = (seed: number) => {
  let state = seed >>> 0
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0
    return state / 0x100000000
  }
}

export type Bag = {
  next: () => PieceKind
  peek: () => PieceKind
}

export const createBag = (rng: Rng = defaultRng) => {
  let queue: PieceKind[] = []

  const refill = () => {
    const bag = [...PIECE_KINDS]
    for (let i = bag.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1))
      ;[bag[i], bag[j]] = [bag[j]!, bag[i]!]
    }
    queue.push(...bag)
  }

  const ensureQueue = () => {
    if (queue.length === 0) {
      refill()
    }
  }

  return {
    next: () => {
      ensureQueue()
      return queue.shift()!
    },
    peek: () => {
      ensureQueue()
      return queue[0]!
    },
  } satisfies Bag
}
