import { api } from '@/lib/axios'
import type { Analysis, StartAnalysisResponse } from '@/types/analysis'

/** Lanza una corrida sobre todos los medidores con los parámetros por defecto del backend. */
export async function startAnalysis(): Promise<StartAnalysisResponse> {
  const response = await api.post<StartAnalysisResponse>('/ai/analyze', {})
  return response.data
}

/** Consulta el estado de una corrida; sirve de fallback cuando Firestore no está disponible. */
export async function getAnalysis(id: string): Promise<Analysis> {
  const response = await api.get<Analysis>(`/ai/analysis/${id}`)
  return response.data
}
