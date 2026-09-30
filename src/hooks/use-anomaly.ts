import { useQuery } from '@tanstack/react-query'

import { queryKeys } from '@/lib/query-keys'
import { getAnomaly } from '@/services/anomalies.service'

/** Expediente de una anomalía; un 404 llega como error para que la pantalla lo resuelva. */
export function useAnomaly(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.anomaly(id ?? ''),
    queryFn: () => getAnomaly(id as string),
    enabled: !!id,
  })
}
