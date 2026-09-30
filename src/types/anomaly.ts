export type AnomalyType =
  | 'REAL_ANOMALY'
  | 'EXPLAINABLE_ANOMALY'
  | 'FALSE_POSITIVE'
  | 'DATA_QUALITY'
export type AnomalySeverity = 'LOW' | 'MEDIUM' | 'HIGH'
export type AnomalyStatus = 'OPEN' | 'REVIEWED' | 'RESOLVED'

export interface AnomalyEvidence {
  baselineKwh: number
  observedKwh: number
  variationPct: number
  signals: string[]
  windowStart: string
  windowEnd: string
  relatedEvents: string[]
  detectorScores: Record<string, number>
}

export interface Anomaly {
  id: string
  meterId: string
  analysisId: string
  detectedAt: string
  type: AnomalyType
  severity: AnomalySeverity
  confidence: number // 0.0 - 1.0
  priorityScore: number
  status: AnomalyStatus
  reason: string | null
  recommendedAction: string | null
  evidence: AnomalyEvidence
}
