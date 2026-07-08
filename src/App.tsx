import { AnimatePresence, motion } from 'motion/react'
import { useState } from 'react'
import { GameView } from './ui/GameView'
import { StartScreen } from './ui/StartScreen'

type Screen = 'start' | 'game'

const screenTransition = {
  initial: { opacity: 0, scale: 0.92 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.95 },
  transition: { type: 'spring' as const, stiffness: 320, damping: 26 },
}

export const App = () => {
  const [screen, setScreen] = useState<Screen>('start')

  return (
    <AnimatePresence mode="wait">
      {screen === 'game' ? (
        <motion.div key="game" className="screen-wrapper" {...screenTransition}>
          <GameView onExit={() => setScreen('start')} />
        </motion.div>
      ) : (
        <motion.div key="start" className="screen-wrapper" {...screenTransition}>
          <StartScreen onStart={() => setScreen('game')} />
        </motion.div>
      )}
    </AnimatePresence>
  )
}
