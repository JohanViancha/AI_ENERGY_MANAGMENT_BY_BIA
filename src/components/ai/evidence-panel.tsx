import { formatDateTime, formatKwh, formatNumber } from '@/lib/format'
import type { AnomalyEvidence } from '@/types/anomaly'

export interface EvidencePanelProps {
  evidence: AnomalyEvidence
}

function formatVariation(variationPct: number): string {
  const sign = variationPct > 0 ? '+' : ''
  return `${sign}${formatNumber(variationPct, 1)} %`
}

/** Evidencia de la detección: baseline vs observado, ventana, señales y puntajes por detector. */
export function EvidencePanel({ evidence }: EvidencePanelProps) {
  const detectorScores = Object.entries(evidence.detectorScores)

  return (
    <div className="space-y-6">
      <dl className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-lg border bg-card p-4">
          <dt className="text-sm text-muted-foreground">Baseline</dt>
          <dd className="text-xl font-semibold">{formatKwh(evidence.baselineKwh)}</dd>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <dt className="text-sm text-muted-foreground">Observado</dt>
          <dd className="text-xl font-semibold">{formatKwh(evidence.observedKwh)}</dd>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <dt className="text-sm text-muted-foreground">Variación</dt>
          <dd className="text-xl font-semibold">{formatVariation(evidence.variationPct)}</dd>
        </div>
      </dl>

      <p className="text-sm">
        <span className="text-muted-foreground">Ventana: </span>
        {formatDateTime(evidence.windowStart)} – {formatDateTime(evidence.windowEnd)}
      </p>

      <div className="space-y-2">
        <h3 className="text-sm font-medium">Señales</h3>
        {evidence.signals.length === 0 ? (
          <p className="text-sm text-muted-foreground">Sin señales registradas.</p>
        ) : (
          <ul className="list-disc space-y-1 pl-5 text-sm">
            {evidence.signals.map((signal) => (
              <li key={signal}>{signal}</li>
            ))}
          </ul>
        )}
      </div>

      <div className="space-y-2">
        <h3 className="text-sm font-medium">Puntajes por detector</h3>
        {detectorScores.length === 0 ? (
          <p className="text-sm text-muted-foreground">Sin puntajes registrados.</p>
        ) : (
          <ul className="space-y-2">
            {detectorScores.map(([detector, score]) => (
              <li key={detector} className="flex items-center gap-3 text-sm">
                <span className="w-40 shrink-0 truncate" title={detector}>
                  {detector}
                </span>
                <div
                  aria-hidden="true"
                  className="h-2 flex-1 overflow-hidden rounded-full bg-secondary"
                >
                  <div
                    className="h-full bg-primary"
                    style={{ width: `${Math.min(100, Math.max(0, score * 100))}%` }}
                  />
                </div>
                <span className="w-12 text-right tabular-nums">{formatNumber(score, 2)}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
