import { formatPercent } from '@/lib/format'

export interface ConfidenceIndicatorProps {
  /** Fracción de 0 a 1. */
  confidence: number
}

/** Barra fina con el porcentaje en texto: el valor no depende solo del color. */
export function ConfidenceIndicator({ confidence }: ConfidenceIndicatorProps) {
  const pct = Math.min(100, Math.max(0, confidence * 100))

  return (
    <div className="flex items-center gap-2">
      <div aria-hidden="true" className="h-1.5 w-16 overflow-hidden rounded-full bg-secondary">
        <div className="h-full bg-primary" style={{ width: `${pct}%` }} />
      </div>
      <span className="tabular-nums">{formatPercent(confidence)}</span>
    </div>
  )
}
