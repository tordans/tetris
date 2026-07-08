import { useEffect, useRef } from 'react'
import { drawPreviewPiece } from '../game/renderer'
import type { PieceKind } from '../engine/pieces'

type NextPiecePreviewProps = {
  kind: PieceKind
  size?: number
}

export const NextPiecePreview = ({ kind, size = 64 }: NextPiecePreviewProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    drawPreviewPiece(ctx, kind, size)
  }, [kind, size])

  return <canvas ref={canvasRef} className="next-preview" aria-hidden="true" />
}
