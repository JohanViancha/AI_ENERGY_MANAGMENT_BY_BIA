import { useQuery } from '@tanstack/react-query'

import { queryKeys } from '@/lib/query-keys'
import { getAnomalies } from '@/services/anomalies.service'

/**
 * Anomalías de un medidor en su última corrida. El backend exige `analysisId`, así que la
 * query queda deshabilitada mientras `MeterDetail.lastAnalysisId` sea `null` o no haya cargado.
 */
export function useMeterAnomalies(
  meterId: string | undefined,
  analysisId: string | null | undefined,
) {
  return useQuery({
    queryKey: queryKeys.meterAnomalies(meterId ?? '', analysisId ?? ''),
    queryFn: () => getAnomalies({ analysisId: analysisId as string, meterId }),
    enabled: !!meterId && !!analysisId,
  })
}
