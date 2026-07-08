import { animate, motion } from 'motion/react'
import { useEffect, useState } from 'react'
import { saveHighscore } from './highscore'
import { vibrateGameOver } from './haptics'

type GameOverOverlayProps = {
  score: number
  onPlayAgain: () => void
}

export const GameOverOverlay = ({ score, onPlayAgain }: GameOverOverlayProps) => {
  const highscore = saveHighscore(score)
  const [displayScore, setDisplayScore] = useState(0)

  useEffect(() => {
    vibrateGameOver()
    const controls = animate(0, score, {
      duration: 1.1,
      ease: 'easeOut',
      onUpdate: (value) => setDisplayScore(Math.round(value)),
    })
    return () => controls.stop()
  }, [score])

  return (
    <motion.div
      className="overlay game-over-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
    >
      <motion.div
        className="overlay-card"
        initial={{ scale: 0.5, opacity: 0, y: 30 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 380, damping: 18 }}
      >
        <h2>Super gespielt!</h2>
        <p className="score-display">{displayScore.toLocaleString('de-DE')} Punkte</p>
        <p className="highscore-label">Rekord: {highscore.toLocaleString('de-DE')}</p>
        <motion.button
          type="button"
          className="btn btn-primary btn-large"
          whileTap={{ scale: 0.9 }}
          onClick={onPlayAgain}
        >
          Nochmal spielen
        </motion.button>
      </motion.div>
    </motion.div>
  )
}
