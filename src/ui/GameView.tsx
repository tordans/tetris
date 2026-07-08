import { AnimatePresence, motion } from 'motion/react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { BOARD_HEIGHT, BOARD_WIDTH } from '../engine/board'
import {
  moveLeft,
  moveRight,
  rotate,
  softDrop,
  startGame,
  togglePause,
  type GameState,
} from '../engine/game'
import { createGameLoop, renderGameBoard } from '../game/loop'
import { GameMenuModal } from './GameMenuModal'
import { GameOverOverlay } from './GameOverOverlay'
import { NextPiecePreview } from './NextPiecePreview'
import { TouchControls } from './TouchControls'
import { vibrateClear, vibrateTick } from './haptics'

type GameViewProps = {
  onExit: () => void
}

const SHOW_GHOST_KEY = 'tetris.showGhost'
const SCREEN_PADDING = 32
const SECTION_GAP = 12

const readShowGhost = () => {
  const stored = localStorage.getItem(SHOW_GHOST_KEY)
  return stored === null ? true : stored === 'true'
}

const TAP_THRESHOLD_PX = 20
const SWIPE_DOWN_THRESHOLD_PX = 40

export const GameView = ({ onExit }: GameViewProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const headerRef = useRef<HTMLElement>(null)
  const touchControlsRef = useRef<HTMLDivElement>(null)
  const stateRef = useRef<GameState>(startGame())
  const loopRef = useRef<ReturnType<typeof createGameLoop> | null>(null)
  const softDropIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const pointerStartRef = useRef<{ x: number; y: number } | null>(null)
  const prevScoreRef = useRef(0)
  const [state, setState] = useState<GameState>(stateRef.current)
  const [cellSize, setCellSize] = useState(16)
  const [scorePopup, setScorePopup] = useState<{ id: number; amount: number } | null>(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const [showGhost, setShowGhost] = useState(readShowGhost)

  const computeCellSize = useCallback(() => {
    const headerHeight = headerRef.current?.offsetHeight ?? 72
    const touchHeight = touchControlsRef.current?.offsetHeight ?? 68
    const availWidth = window.innerWidth - 24
    const availHeight =
      window.innerHeight - headerHeight - touchHeight - SCREEN_PADDING - SECTION_GAP
    return Math.max(
      8,
      Math.floor(Math.min(availWidth / BOARD_WIDTH, availHeight / BOARD_HEIGHT)),
    )
  }, [])

  const syncState = useCallback((next: GameState) => {
    stateRef.current = next
    setState(next)
  }, [])

  const draw = useCallback(
    (canvas?: HTMLCanvasElement, flash?: number) => {
      const target = canvas ?? canvasRef.current
      if (!target) return
      renderGameBoard(target, stateRef.current, cellSize, { clearingFlash: flash, showGhost })
    },
    [cellSize, showGhost],
  )

  useEffect(() => {
    const updateSize = () => setCellSize(computeCellSize())
    updateSize()

    const observer = new ResizeObserver(updateSize)
    if (headerRef.current) observer.observe(headerRef.current)
    if (touchControlsRef.current) observer.observe(touchControlsRef.current)

    window.addEventListener('resize', updateSize)
    window.addEventListener('orientationchange', updateSize)
    return () => {
      observer.disconnect()
      window.removeEventListener('resize', updateSize)
      window.removeEventListener('orientationchange', updateSize)
    }
  }, [computeCellSize])

  useEffect(() => {
    draw()
  }, [draw, state, cellSize, showGhost])

  useEffect(() => {
    if (state.score > prevScoreRef.current) {
      const amount = state.score - prevScoreRef.current
      setScorePopup({ id: Date.now(), amount })
    }
    prevScoreRef.current = state.score
  }, [state.score])

  useEffect(() => {
    if (!scorePopup) return
    const timer = setTimeout(() => setScorePopup(null), 1200)
    return () => clearTimeout(timer)
  }, [scorePopup])

  useEffect(() => {
    const loop = createGameLoop({
      getState: () => stateRef.current,
      setState: (next) => {
        stateRef.current = next
      },
      onStateChange: setState,
      onLineClear: vibrateClear,
      draw: (canvas, flash) =>
        renderGameBoard(canvas, stateRef.current, cellSize, { clearingFlash: flash, showGhost }),
    })
    loopRef.current = loop
    loop.start()
    return () => loop.stop()
  }, [cellSize, showGhost])

  useEffect(() => {
    const onVisibility = () => {
      if (document.hidden && stateRef.current.phase === 'playing') {
        syncState(togglePause(stateRef.current))
      }
    }
    document.addEventListener('visibilitychange', onVisibility)
    return () => document.removeEventListener('visibilitychange', onVisibility)
  }, [syncState])

  const applyAction = useCallback(
    (action: (s: GameState) => GameState) => {
      const next = action(stateRef.current)
      if (next !== stateRef.current) {
        syncState(next)
        draw()
      }
    },
    [draw, syncState],
  )

  const stopSoftDrop = useCallback(() => {
    if (softDropIntervalRef.current) {
      clearInterval(softDropIntervalRef.current)
      softDropIntervalRef.current = null
    }
  }, [])

  const startSoftDrop = useCallback(() => {
    stopSoftDrop()
    applyAction(softDrop)
    softDropIntervalRef.current = setInterval(() => {
      applyAction(softDrop)
    }, 80)
  }, [applyAction, stopSoftDrop])

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (stateRef.current.phase === 'gameOver') return

      if (e.key === 'ArrowLeft') {
        e.preventDefault()
        applyAction(moveLeft)
      } else if (e.key === 'ArrowRight') {
        e.preventDefault()
        applyAction(moveRight)
      } else if (e.key === 'ArrowUp' || e.key === ' ') {
        e.preventDefault()
        applyAction(rotate)
      } else if (e.key === 'ArrowDown') {
        e.preventDefault()
        if (!softDropIntervalRef.current) {
          startSoftDrop()
        }
      } else if (e.key === 'p' || e.key === 'P') {
        if (stateRef.current.phase !== 'clearing' && !menuOpen) {
          applyAction(togglePause)
        }
      } else if (e.key === 'Escape') {
        if (menuOpen) {
          setMenuOpen(false)
        } else {
          onExit()
        }
      }
    }

    const onKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        stopSoftDrop()
      }
    }

    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
      stopSoftDrop()
    }
  }, [applyAction, menuOpen, onExit, startSoftDrop, stopSoftDrop])

  const handlePlayAgain = () => {
    const next = startGame()
    prevScoreRef.current = 0
    setScorePopup(null)
    setMenuOpen(false)
    syncState(next)
    loopRef.current?.resetGravity()
    draw()
  }

  const handleShowGhostChange = (value: boolean) => {
    setShowGhost(value)
    localStorage.setItem(SHOW_GHOST_KEY, String(value))
    draw()
  }

  const handleOpenMenu = () => {
    vibrateTick()
    if (stateRef.current.phase === 'playing') {
      syncState(togglePause(stateRef.current))
    }
    setMenuOpen(true)
  }

  const handleCloseMenu = () => {
    vibrateTick()
    setMenuOpen(false)
  }

  const handleCanvasPointerDown = (e: React.PointerEvent) => {
    if (controlsDisabled) return
    pointerStartRef.current = { x: e.clientX, y: e.clientY }
  }

  const handleCanvasPointerUp = (e: React.PointerEvent) => {
    if (!pointerStartRef.current || controlsDisabled) return

    const dx = e.clientX - pointerStartRef.current.x
    const dy = e.clientY - pointerStartRef.current.y
    const dist = Math.hypot(dx, dy)

    if (dist < TAP_THRESHOLD_PX) {
      vibrateTick()
      applyAction(rotate)
    } else if (dy > SWIPE_DOWN_THRESHOLD_PX && Math.abs(dy) > Math.abs(dx)) {
      vibrateTick()
      applyAction(softDrop)
    }

    pointerStartRef.current = null
  }

  const isPaused = state.phase === 'paused'
  const isPlaying = state.phase === 'playing'
  const controlsDisabled = !isPlaying
  const showPauseOverlay = isPaused && !menuOpen

  return (
    <div className="screen game-screen">
      <header ref={headerRef} className="game-header">
        <motion.button
          type="button"
          className="btn btn-icon"
          aria-label="Menü"
          whileTap={{ scale: 0.9 }}
          onClick={handleOpenMenu}
          disabled={state.phase === 'gameOver' || state.phase === 'clearing'}
        >
          ☰
        </motion.button>

        <div className="game-header-stats">
          <div className="stat score-stat">
            <span className="stat-label">Punkte</span>
            <span className="stat-value">{state.score.toLocaleString('de-DE')}</span>
            <AnimatePresence>
              {scorePopup && (
                <motion.span
                  key={scorePopup.id}
                  className="score-popup"
                  initial={{ opacity: 0, y: 8, scale: 0.6 }}
                  animate={{ opacity: 1, y: -4, scale: 1 }}
                  exit={{ opacity: 0, y: -20, scale: 0.8 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 22 }}
                >
                  +{scorePopup.amount.toLocaleString('de-DE')}!
                </motion.span>
              )}
            </AnimatePresence>
          </div>
          <div className="stat">
            <span className="stat-label">Linien</span>
            <span className="stat-value">{state.lines}</span>
          </div>
          <div className="stat">
            <span className="stat-label">Level</span>
            <span className="stat-value">{state.level}</span>
          </div>
        </div>

        <div className="game-header-actions">
          <motion.button
            type="button"
            className="btn btn-icon"
            aria-label={isPaused ? 'Weiter' : 'Pause'}
            whileTap={{ scale: 0.9 }}
            onClick={() => {
              vibrateTick()
              applyAction(togglePause)
            }}
            disabled={state.phase === 'gameOver' || state.phase === 'clearing' || menuOpen}
          >
            {isPaused ? '▶' : '⏸'}
          </motion.button>
          <div className="next-piece">
            <span className="stat-label">Nächster</span>
            <NextPiecePreview kind={state.next} />
          </div>
        </div>
      </header>

      <div className="board-area">
        <canvas
          ref={canvasRef}
          data-board
          className="game-board"
          aria-label="Spielfeld"
          onPointerDown={handleCanvasPointerDown}
          onPointerUp={handleCanvasPointerUp}
          onPointerCancel={() => {
            pointerStartRef.current = null
          }}
        />
        <AnimatePresence>
          {showPauseOverlay && (
            <motion.div
              className="overlay pause-overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.button
                type="button"
                className="btn btn-primary btn-large"
                whileTap={{ scale: 0.9 }}
                onClick={() => {
                  vibrateTick()
                  applyAction(togglePause)
                }}
              >
                Weiter
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
        <AnimatePresence>
          {menuOpen && (
            <GameMenuModal
              showGhost={showGhost}
              onShowGhostChange={handleShowGhostChange}
              onRestart={handlePlayAgain}
              onExit={onExit}
              onClose={handleCloseMenu}
            />
          )}
        </AnimatePresence>
        <AnimatePresence>
          {state.phase === 'gameOver' && (
            <GameOverOverlay score={state.score} onPlayAgain={handlePlayAgain} />
          )}
        </AnimatePresence>
      </div>

      <div ref={touchControlsRef}>
        <TouchControls
          disabled={controlsDisabled}
          onLeft={() => applyAction(moveLeft)}
          onRight={() => applyAction(moveRight)}
          onRotate={() => applyAction(rotate)}
          onSoftDropStart={startSoftDrop}
          onSoftDropEnd={stopSoftDrop}
        />
      </div>
    </div>
  )
}
