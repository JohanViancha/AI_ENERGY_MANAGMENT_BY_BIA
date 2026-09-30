export type AnalysisStatus = 'RUNNING' | 'COMPLETED' | 'FAILED'
export type AnalysisPhase =
  | 'READINGS'
  | 'BASELINE'
  | 'DETECTION'
  | 'CORRELATION'
  | 'EVENTS'
  | 'EXPLANATION'
  | 'RECOMMENDATION'

export interface AnalysisProgress {
  phase: AnalysisPhase
  pct: number // 0-100, progreso global del proceso completo
}

// Forma HTTP (camelCase): POST /ai/analyze y GET /ai/analysis/:id
export interface Analysis {
  id: string
  startedAt: string
  finishedAt: string | null
  status: AnalysisStatus
  errorCode: string | null
  errorMessage: string | null
  triggeredBy: 'MANUAL' | 'SCHEDULED'
  metersAnalyzed: string[]
  progress: AnalysisProgress
  anomaliesCount: number
  highPriorityCount: number
}

export interface StartAnalysisResponse {
  analysisId: string
  status: 'RUNNING'
}

// Forma de Firestore (snake_case): documento analyses/{analysisId}, sin `id`
export interface AnalysisFirestoreDoc {
  started_at: string
  finished_at: string | null
  status: AnalysisStatus
  error_code: string | null
  error_message: string | null
  triggered_by: 'MANUAL' | 'SCHEDULED'
  meters_analyzed: string[]
  progress: { phase: AnalysisPhase; pct: number }
  anomalies_count: number
  high_priority_count: number
}
