import { SearchX } from 'lucide-react'
import { useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'

import { MeterFilters } from '@/components/meters/meter-filters'
import {
  applyMeterListParams,
  DEFAULT_METER_LIST_PARAMS,
  matchesMeterSearch,
  parseMeterListParams,
  serializeMeterListParams,
  toggleMeterSort,
  type MeterListParams,
  type MeterStatusFilter,
} from '@/components/meters/meter-list-params'
import { getMeterStatus } from '@/components/meters/meter-status'
import { MeterTable } from '@/components/meters/meter-table'
import { EmptyState } from '@/components/shared/empty-state'
import { ErrorState } from '@/components/shared/error-state'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useMeters } from '@/hooks/use-meters'
import type { MeterSummary } from '@/types/meter'

const SKELETON_ROWS = 12

/** Los conteos de cada tab respetan la búsqueda para coincidir con las filas que produce. */
function countByStatus(meters: MeterSummary[], q: string): Record<MeterStatusFilter, number> {
  const counts: Record<MeterStatusFilter, number> = { ALL: 0, OK: 0, ALERT: 0, CRITICAL: 0 }
  for (const meter of meters) {
    if (!matchesMeterSearch(meter, q)) continue
    counts.ALL += 1
    counts[getMeterStatus(meter)] += 1
  }
  return counts
}

/** Pantalla protegida `/meters`: lista filtrable y ordenable, con el estado en la URL. */
export function MetersPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const params = useMemo(() => parseMeterListParams(searchParams), [searchParams])
  const meters = useMeters()

  const visibleMeters = useMemo(
    () => (meters.data ? applyMeterListParams(meters.data, params) : []),
    [meters.data, params],
  )
  const counts = useMemo(
    () => countByStatus(meters.data ?? [], params.q),
    [meters.data, params.q],
  )

  // La búsqueda reemplaza la entrada del historial para no llenarlo de una por tecla.
  function updateParams(next: MeterListParams, options?: { replace?: boolean }) {
    setSearchParams(serializeMeterListParams(next), options)
  }

  function clearFilters() {
    updateParams(DEFAULT_METER_LIST_PARAMS)
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Medidores</h1>

      {meters.isError && !meters.data ? (
        <ErrorState
          title="No se pudieron cargar los medidores"
          onRetry={() => void meters.refetch()}
        />
      ) : meters.isPending ? (
        <div aria-busy="true" className="space-y-2">
          <Skeleton className="h-10 w-full" />
          {Array.from({ length: SKELETON_ROWS }, (_, index) => (
            <Skeleton key={index} className="h-12 w-full" />
          ))}
        </div>
      ) : (
        <>
          <MeterFilters
            status={params.status}
            query={params.q}
            counts={counts}
            onStatusChange={(status) => updateParams({ ...params, status })}
            onQueryChange={(q) => updateParams({ ...params, q }, { replace: true })}
          />
          {visibleMeters.length === 0 ? (
            <EmptyState
              icon={SearchX}
              title="Ningún medidor coincide"
              description="Prueba con otro estado o con otra búsqueda."
              action={
                <Button variant="outline" onClick={clearFilters}>
                  Limpiar filtros
                </Button>
              }
            />
          ) : (
            <MeterTable
              meters={visibleMeters}
              params={params}
              onSort={(sort) => updateParams(toggleMeterSort(params, sort))}
            />
          )}
        </>
      )}
    </div>
  )
}
