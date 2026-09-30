export interface DashboardSummary {
  analysisId: string | null // null si nunca corrió una corrida COMPLETED
  finishedAt: string | null
  anomaliesCount: number
  bySeverity: { HIGH: number; MEDIUM: number; LOW: number }
  byType: Record<string, number>
  avgConfidence: number | null // 0.0 - 1.0
}
