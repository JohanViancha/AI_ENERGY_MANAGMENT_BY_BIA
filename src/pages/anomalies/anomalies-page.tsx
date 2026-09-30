import { CheckCircle2, SearchX, Sparkles } from 'lucide-react'
import { useMemo } from 'react'
import { Link, useSearchParams } from 'react-router-dom'

import { AnomalyFilters } from '@/components/anomalies/anomaly-filters'
import {
  applyAnomalyListParams,
  DEFAULT_ANOMALY_LIST_PARAMS,
  parseAnomalyListParams,
  serializeAnomalyListParams,
  type AnomalyListParams,
} from '@/components/anomalies/anomaly-list-params'
import { AnomalyTable } from '@/components/anomalies/anomaly-table'
import { EmptyState } from '@/components/shared/empty-state'
import { ErrorState } from '@/components/shared/error-state'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useAnomalies } from '@/hooks/use-anomalies'
import { useDashboardSummary } from '@/hooks/use-dashboard-summary'

const SKELETON_ROWS = 8

/** Pantalla protegida `/anomalies`: anomalías de la última corrida, filtradas desde la URL. */
export function AnomaliesPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const params = useMemo(() => parseAnomalyListParams(searchParams), [searchParams])
  const summary = useDashboardSummary()
  const analysisId = summary.data?.analysisId
  const anomalies = useAnomalies(analysisId)

  const visibleAnomalies = useMemo(
    () => (anomalies.data ? applyAnomalyListParams(anomalies.data, params) : []),
    [anomalies.data, params],
  )
  const meterIds = useMemo(
    () => [...new Set((anomalies.data ?? []).map((anomaly) => anomaly.meterId))].sort(),
    [anomalies.data],
  )

  function updateParams(next: AnomalyListParams) {
    setSearchParams(serializeAnomalyListParams(next))
  }

  function renderContent() {
    if (summary.isError && !summary.data) {
      return (
        <ErrorState
          title="No se pudo cargar el resumen del análisis"
          onRetry={() => void summary.refetch()}
        />
      )
    }
    if (analysisId === null) {
      return (
        <EmptyState
          icon={Sparkles}
          title="Aún no hay análisis"
          description="Ve al Dashboard y ejecuta un análisis de IA para ver aquí las anomalías."
          action={
            <Button asChild variant="outline">
              <Link to="/">Ir al Dashboard</Link>
            </Button>
          }
        />
      )
    }
    if (anomalies.isError && !anomalies.data) {
      return (
        <ErrorState
          title="No se pudieron cargar las anomalías"
          onRetry={() => void anomalies.refetch()}
        />
      )
    }
    if (summary.isPending || anomalies.isPending) {
      return (
        <div aria-busy="true" className="space-y-2">
          <Skeleton className="h-10 w-full" />
          {Array.from({ length: SKELETON_ROWS }, (_, index) => (
            <Skeleton key={index} className="h-12 w-full" />
          ))}
        </div>
      )
    }
    if (anomalies.data.length === 0) {
      return (
        <EmptyState
          icon={CheckCircle2}
          title="Sin anomalías detectadas"
          description="La última corrida del análisis no encontró anomalías."
        />
      )
    }
    return (
      <>
        <AnomalyFilters params={params} meterIds={meterIds} onChange={updateParams} />
        {visibleAnomalies.length === 0 ? (
          <EmptyState
            icon={SearchX}
            title="Ninguna anomalía coincide"
            description="Prueba con otra severidad, tipo o medidor."
            action={
              <Button variant="outline" onClick={() => updateParams(DEFAULT_ANOMALY_LIST_PARAMS)}>
                Limpiar filtros
              </Button>
            }
          />
        ) : (
          <AnomalyTable anomalies={visibleAnomalies} />
        )}
      </>
    )
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Anomalías</h1>
      {renderContent()}
    </div>
  )
}
