import { useQuery } from '@tanstack/react-query'

import { queryKeys } from '@/lib/query-keys'
import { getMeters } from '@/services/meters.service'

/** Lista de medidores con sus contadores de anomalías abiertas. */
export function useMeters() {
  return useQuery({
    queryKey: queryKeys.meters,
    queryFn: getMeters,
  })
}
