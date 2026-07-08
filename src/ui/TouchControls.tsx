import { motion } from 'motion/react'
import { vibrateTick } from './haptics'

type TouchControlsProps = {
  onLeft: () => void
  onRight: () => void
  onRotate: () => void
  onSoftDropStart: () => void
  onSoftDropEnd: () => void
  disabled?: boolean
}

const ControlButton = ({
  label,
  ariaLabel,
  disabled,
  onPress,
  onRelease,
}: {
  label: string
  ariaLabel: string
  disabled: boolean
  onPress: () => void
  onRelease?: () => void
}) => (
  <motion.button
    type="button"
    className="btn btn-control"
    disabled={disabled}
    aria-label={ariaLabel}
    whileTap={disabled ? undefined : { scale: 0.9 }}
    onPointerDown={(e) => {
      e.preventDefault()
      if (disabled) return
      vibrateTick()
      onPress()
    }}
    onPointerUp={(e) => {
      e.preventDefault()
      onRelease?.()
    }}
    onPointerLeave={onRelease}
    onPointerCancel={onRelease}
  >
    {label}
  </motion.button>
)

export const TouchControls = ({
  onLeft,
  onRight,
  onRotate,
  onSoftDropStart,
  onSoftDropEnd,
  disabled = false,
}: TouchControlsProps) => {
  return (
    <div className="touch-controls">
      <ControlButton label="←" ariaLabel="Nach links" disabled={disabled} onPress={onLeft} />
      <ControlButton label="⟳" ariaLabel="Drehen" disabled={disabled} onPress={onRotate} />
      <ControlButton label="→" ariaLabel="Nach rechts" disabled={disabled} onPress={onRight} />
      <ControlButton
        label="↓"
        ariaLabel="Schneller fallen"
        disabled={disabled}
        onPress={onSoftDropStart}
        onRelease={onSoftDropEnd}
      />
    </div>
  )
}
