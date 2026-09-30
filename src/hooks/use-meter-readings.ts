import { useQuery } from '@tanstack/react-query'

import { queryKeys } from '@/lib/query-keys'
import { getMeterReadings } from '@/services/meters.service'

export interface UseMeterReadingsParams {
  meterId: string | undefined
  from: string
  to: string
}

/**
 * Lecturas de un medidor en un rango. Queda deshabilitado mientras falte alguno de los
 * parámetros: el rango se ancla en `lastReadingAt`, que solo se conoce tras cargar el detalle.
 */
export function useMeterReadings({ meterId, from, to }: UseMeterReadingsParams) {
  return useQuery({
    queryKey: queryKeys.meterReadings(meterId ?? '', from, to),
    queryFn: () => getMeterReadings(meterId as string, { from, to }),
    enabled: !!meterId && !!from && !!to,
  })
}
