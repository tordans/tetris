import { motion } from 'motion/react'
import { vibrateTick } from './haptics'

type GameMenuModalProps = {
  showGhost: boolean
  onShowGhostChange: (value: boolean) => void
  onRestart: () => void
  onExit: () => void
  onClose: () => void
}

export const GameMenuModal = ({
  showGhost,
  onShowGhostChange,
  onRestart,
  onExit,
  onClose,
}: GameMenuModalProps) => {
  return (
    <motion.div
      className="overlay game-menu-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
    >
      <motion.div
        className="overlay-card game-menu-card"
        initial={{ scale: 0.5, opacity: 0, y: 30 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 380, damping: 18 }}
      >
        <h2>Menü</h2>
        <div className="menu-actions">
          <motion.button
            type="button"
            className="btn btn-primary"
            whileTap={{ scale: 0.9 }}
            onClick={() => {
              vibrateTick()
              onRestart()
            }}
          >
            Neu starten
          </motion.button>
          <label className="menu-toggle">
            <input
              type="checkbox"
              checked={showGhost}
              onChange={(e) => {
                vibrateTick()
                onShowGhostChange(e.target.checked)
              }}
            />
            <span>Schatten anzeigen</span>
          </label>
          <motion.button
            type="button"
            className="btn btn-secondary"
            whileTap={{ scale: 0.9 }}
            onClick={() => {
              vibrateTick()
              onClose()
            }}
          >
            Schließen
          </motion.button>
          <motion.button
            type="button"
            className="btn btn-secondary"
            whileTap={{ scale: 0.9 }}
            onClick={() => {
              vibrateTick()
              onExit()
            }}
          >
            Zum Startbildschirm
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  )
}
