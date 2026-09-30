import { AlertCircle, CheckCircle2, Circle, Loader2, XCircle } from 'lucide-react'

import type { AnalysisTransport } from '@/hooks/use-analysis'
import { ANALYSIS_PHASES } from '@/lib/analysis-phases'
import { cn } from '@/lib/utils'
import type { Analysis } from '@/types/analysis'

export interface AnalysisProgressProps {
  /** `null` mientras se espera el primer estado de la corrida recién lanzada. */
  analysis: Analysis | null
  transport?: AnalysisTransport | null
}

type PhaseState = 'done' | 'current' | 'failed' | 'pending'

const STATE_LABELS: Record<PhaseState, string> = {
  done: 'Hecha',
  current: 'En curso',
  failed: 'Fallida',
  pending: 'Pendiente',
}

/** Una fase desconocida (índice -1) deja todas pendientes en lugar de romper la pantalla. */
function getPhaseState(analysis: Analysis | null, index: number): PhaseState {
  if (!analysis) return 'pending'
  if (analysis.status === 'COMPLETED') return 'done'
  const currentIndex = ANALYSIS_PHASES.findIndex(({ phase }) => phase === analysis.progress.phase)
  if (currentIndex === -1) return 'pending'
  if (index < currentIndex) return 'done'
  if (index > currentIndex) return 'pending'
  return analysis.status === 'FAILED' ? 'failed' : 'current'
}

function PhaseIcon({ state }: { state: PhaseState }) {
  const className = 'h-4 w-4 shrink-0'
  if (state === 'done') {
    return <CheckCircle2 className={cn(className, 'text-emerald-600')} aria-hidden="true" />
  }
  if (state === 'current') {
    return <Loader2 className={cn(className, 'animate-spin text-primary')} aria-hidden="true" />
  }
  if (state === 'failed') {
    return <XCircle className={cn(className, 'text-destructive')} aria-hidden="true" />
  }
  return <Circle className={cn(className, 'text-muted-foreground')} aria-hidden="true" />
}

/** Barra de progreso global y estado de las 7 fases del análisis. */
export function AnalysisProgress({ analysis, transport = null }: AnalysisProgressProps) {
  const pct = analysis?.status === 'COMPLETED' ? 100 : Math.round(analysis?.progress.pct ?? 0)

  return (
    <section aria-label="Progreso del análisis" className="space-y-4 rounded-lg border bg-card p-4">
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium">Análisis de IA</span>
          <span className="flex items-center gap-2 text-muted-foreground">
            {transport === 'polling' && <span>Modo polling</span>}
            <span>{pct}%</span>
          </span>
        </div>
        <div
          role="progressbar"
          aria-label="Progreso global del análisis"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={pct}
          className="h-2 w-full overflow-hidden rounded-full bg-secondary"
        >
          <div
            className={cn(
              'h-full transition-all',
              analysis?.status === 'FAILED' ? 'bg-destructive' : 'bg-primary',
            )}
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      <ol className="grid gap-2 sm:grid-cols-2">
        {ANALYSIS_PHASES.map(({ phase, label }, index) => {
          const state = getPhaseState(analysis, index)
          return (
            <li
              key={phase}
              aria-current={state === 'current' ? 'step' : undefined}
              className={cn(
                'flex items-center gap-2 text-sm',
                state === 'pending' && 'text-muted-foreground',
              )}
            >
              <PhaseIcon state={state} />
              <span>{label}</span>
              <span className="ml-auto text-xs text-muted-foreground">{STATE_LABELS[state]}</span>
            </li>
          )
        })}
      </ol>

      {analysis?.status === 'FAILED' && (
        <p role="alert" className="flex items-start gap-2 text-sm text-destructive">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          {analysis.errorMessage ?? 'El análisis falló. Inténtalo de nuevo.'}
        </p>
      )}
    </section>
  )
}
