import { useQuery } from '@tanstack/react-query'

import { queryKeys } from '@/lib/query-keys'
import { getDashboardSummary } from '@/services/dashboard.service'

/** Resumen de la última corrida COMPLETED del análisis de IA. */
export function useDashboardSummary() {
  return useQuery({
    queryKey: queryKeys.dashboardSummary,
    queryFn: getDashboardSummary,
  })
}
