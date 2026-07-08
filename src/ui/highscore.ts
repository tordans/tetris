const HIGHSCORE_KEY = 'tetris-highscore'

export const getHighscore = () => {
  const raw = localStorage.getItem(HIGHSCORE_KEY)
  if (!raw) return 0
  const value = Number.parseInt(raw, 10)
  return Number.isFinite(value) ? value : 0
}

export const saveHighscore = (score: number) => {
  const current = getHighscore()
  if (score > current) {
    localStorage.setItem(HIGHSCORE_KEY, String(score))
    return score
  }
  return current
}
