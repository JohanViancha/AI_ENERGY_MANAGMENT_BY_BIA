import { useQuery } from '@tanstack/react-query'

import { queryKeys } from '@/lib/query-keys'
import { getAnomalies } from '@/services/anomalies.service'

/**
 * Anomalías de una corrida completa. El backend exige `analysisId`, así que la query queda
 * deshabilitada mientras el resumen del dashboard no lo haya entregado.
 */
export function useAnomalies(analysisId: string | null | undefined) {
  return useQuery({
    queryKey: queryKeys.anomalies(analysisId ?? ''),
    queryFn: () => getAnomalies({ analysisId: analysisId as string }),
    enabled: !!analysisId,
  })
}
