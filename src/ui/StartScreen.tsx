import { motion } from 'motion/react'
import { getHighscore } from './highscore'
import { vibrateTick } from './haptics'

type StartScreenProps = {
  onStart: () => void
}

const TITLE = 'Tetris'
const LETTER_COLORS = ['#00e5ff', '#ffea00', '#d500f9', '#00e676', '#ff1744', '#2979ff', '#ff9100']

export const StartScreen = ({ onStart }: StartScreenProps) => {
  const highscore = getHighscore()

  return (
    <div className="screen start-screen">
      <h1 className="title" aria-label="Tetris">
        {TITLE.split('').map((letter, index) => (
          <motion.span
            key={`${letter}-${index}`}
            className="title-letter"
            initial={{ y: -50, opacity: 0, rotate: -25 }}
            animate={{ y: 0, opacity: 1, rotate: 0 }}
            transition={{
              type: 'spring',
              stiffness: 420,
              damping: 14,
              delay: index * 0.07,
            }}
            style={{ color: LETTER_COLORS[index % LETTER_COLORS.length] }}
          >
            {letter}
          </motion.span>
        ))}
      </h1>
      <motion.p
        className="subtitle"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.55, type: 'spring', stiffness: 300, damping: 24 }}
      >
        Baue Reihen und sammle Punkte!
      </motion.p>
      {highscore > 0 && (
        <motion.p
          className="highscore-label"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
        >
          Rekord: {highscore.toLocaleString('de-DE')}
        </motion.p>
      )}
      <motion.button
        type="button"
        className="btn btn-primary btn-large"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.65, type: 'spring', stiffness: 400, damping: 18 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => {
          vibrateTick()
          onStart()
        }}
      >
        Spielen
      </motion.button>
    </div>
  )
}
