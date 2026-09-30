import { api } from '@/lib/axios'
import type { Anomaly } from '@/types/anomaly'

export interface AnomaliesParams {
  analysisId: string
  meterId?: string
}

/** Lista las anomalías de una corrida; el backend exige `analysisId`. */
export async function getAnomalies(params: AnomaliesParams): Promise<Anomaly[]> {
  const response = await api.get<Anomaly[]>('/anomalies', { params })
  return response.data
}
