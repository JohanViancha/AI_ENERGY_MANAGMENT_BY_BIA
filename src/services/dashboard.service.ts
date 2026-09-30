import { api } from '@/lib/axios'
import type { DashboardSummary } from '@/types/dashboard'

/** Resume la última corrida COMPLETED del análisis de IA. */
export async function getDashboardSummary(): Promise<DashboardSummary> {
  const response = await api.get<DashboardSummary>('/dashboard/summary')
  return response.data
}
