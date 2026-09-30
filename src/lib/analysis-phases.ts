import type { AnalysisPhase } from '@/types/analysis'

// Orden fijo de las 7 fases; el índice decide si una fase está hecha, en curso o pendiente.
// COMPLETED → las 7 hechas. FAILED → la fase de `progress.phase` queda marcada como fallida.
export const ANALYSIS_PHASES: { phase: AnalysisPhase; label: string }[] = [
  { phase: 'READINGS', label: 'Carga de lecturas' },
  { phase: 'BASELINE', label: 'Cálculo de baseline' },
  { phase: 'DETECTION', label: 'Detección de anomalías' },
  { phase: 'CORRELATION', label: 'Correlación con eventos' },
  { phase: 'EVENTS', label: 'Clasificación' },
  { phase: 'EXPLANATION', label: 'Explicación' },
  { phase: 'RECOMMENDATION', label: 'Recomendación' },
]
