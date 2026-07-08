import { describe, expect, test } from 'bun:test'
import { createBag, createSeededRng } from './bag'
import { PIECE_KINDS } from './pieces'

describe('7-bag randomizer', () => {
  test('each bag contains all 7 pieces exactly once', () => {
    const bag = createBag(createSeededRng(42))
    const drawn: string[] = []
    for (let i = 0; i < 7; i++) {
      drawn.push(bag.next())
    }
    expect(drawn.sort()).toEqual([...PIECE_KINDS].sort())
  })

  test('peek returns next without consuming', () => {
    const bag = createBag(createSeededRng(7))
    const peeked = bag.peek()
    expect(bag.next()).toBe(peeked)
  })

  test('seeded RNG is deterministic', () => {
    const draw = (seed: number) => {
      const bag = createBag(createSeededRng(seed))
      return Array.from({ length: 14 }, () => bag.next())
    }
    expect(draw(123)).toEqual(draw(123))
    expect(draw(123)).not.toEqual(draw(456))
  })

  test('two consecutive bags each have all 7 kinds', () => {
    const bag = createBag(createSeededRng(99))
    const first = Array.from({ length: 7 }, () => bag.next())
    const second = Array.from({ length: 7 }, () => bag.next())
    expect(first.sort()).toEqual([...PIECE_KINDS].sort())
    expect(second.sort()).toEqual([...PIECE_KINDS].sort())
  })
})
