const canVibrate = () =>
  typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function'

export const vibrateTick = () => {
  if (canVibrate()) navigator.vibrate(10)
}

export const vibrateClear = () => {
  if (canVibrate()) navigator.vibrate(50)
}

export const vibrateGameOver = () => {
  if (canVibrate()) navigator.vibrate([100, 50, 100, 50, 200])
}
