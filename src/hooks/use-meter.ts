import { useQuery } from '@tanstack/react-query'

import { queryKeys } from '@/lib/query-keys'
import { getMeter } from '@/services/meters.service'

/** Detalle de un medidor; un 404 llega como error para que la pantalla lo resuelva. */
export function useMeter(meterId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.meter(meterId ?? ''),
    queryFn: () => getMeter(meterId as string),
    enabled: !!meterId,
  })
}
