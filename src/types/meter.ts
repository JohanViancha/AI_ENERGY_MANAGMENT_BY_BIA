export interface MeterSummary {
  meterId: string
  lastReadingAt: string | null // ISO 8601
  lastConsumptionKwh: number | null
  openAnomaliesCount: number
  highSeverityOpenCount: number
}

export interface MeterDetail extends MeterSummary {
  totalReadingsCount: number
  lastAnalysisId: string | null
  anomaliesByType: Record<string, number>
}

// Derivado en el frontend, el backend no lo devuelve.
export type MeterStatus = 'OK' | 'ALERT' | 'CRITICAL'
