import { AlertTriangle, Clock, Gauge, ShieldAlert, Sparkles, Zap } from 'lucide-react'

import { KpiCard } from '@/components/dashboard/kpi-card'
import { SummaryPanel } from '@/components/dashboard/summary-panel'
import { EmptyState } from '@/components/shared/empty-state'
import { ErrorState } from '@/components/shared/error-state'
import { Skeleton } from '@/components/ui/skeleton'
import { useDashboardSummary } from '@/hooks/use-dashboard-summary'
import { useMeters } from '@/hooks/use-meters'
import { formatDateTime, formatKwh, formatNumber, formatPercent, formatRelative } from '@/lib/format'
import type { MeterSummary } from '@/types/meter'

/** Suma las últimas lecturas ignorando los `null`; sin ninguna lectura no hay total. */
function sumCurrentConsumption(meters: MeterSummary[]): number | null {
  const values = meters
    .map((meter) => meter.lastConsumptionKwh)
    .filter((value): value is number => value !== null)
  return values.length > 0 ? values.reduce((total, value) => total + value, 0) : null
}

/** Pantalla protegida `/`: KPIs y resumen de anomalías de la última corrida. */
export function DashboardPage() {
  const meters = useMeters()
  const summary = useDashboardSummary()

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Dashboard</h1>

      <section aria-label="Indicadores de medidores" className="grid gap-4 sm:grid-cols-2">
        {meters.isError && !meters.data ? (
          <div className="sm:col-span-2">
            <ErrorState
              title="No se pudieron cargar los medidores"
              onRetry={() => void meters.refetch()}
            />
          </div>
        ) : (
          <>
            <KpiCard
              title="Medidores"
              icon={Gauge}
              isLoading={meters.isPending}
              value={formatNumber(meters.data?.length)}
              description="Registrados en el sistema"
            />
            <KpiCard
              title="Consumo actual"
              icon={Zap}
              isLoading={meters.isPending}
              value={formatKwh(meters.data ? sumCurrentConsumption(meters.data) : null)}
              description="Suma de las últimas lecturas"
            />
          </>
        )}
      </section>

      <section
        aria-label="Indicadores del análisis de IA"
        className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
      >
        {summary.isError && !summary.data ? (
          <div className="sm:col-span-2 xl:col-span-4">
            <ErrorState
              title="No se pudo cargar el resumen de anomalías"
              onRetry={() => void summary.refetch()}
            />
          </div>
        ) : summary.data?.analysisId === null ? (
          <div className="sm:col-span-2 xl:col-span-4">
            <EmptyState
              icon={Sparkles}
              title="Aún no hay análisis"
              description="Cuando se ejecute un análisis de IA verás aquí las anomalías detectadas."
            />
          </div>
        ) : (
          <>
            <KpiCard
              title="Anomalías detectadas"
              icon={AlertTriangle}
              isLoading={summary.isPending}
              value={formatNumber(summary.data?.anomaliesCount)}
              description="En la última corrida"
            />
            <KpiCard
              title="Prioridad alta"
              icon={ShieldAlert}
              isLoading={summary.isPending}
              value={formatNumber(summary.data?.bySeverity.HIGH)}
              description="Anomalías de severidad alta"
            />
            <KpiCard
              title="Confianza IA"
              icon={Sparkles}
              isLoading={summary.isPending}
              value={formatPercent(summary.data?.avgConfidence)}
              description="Promedio de la corrida"
            />
            <KpiCard
              title="Último análisis"
              icon={Clock}
              isLoading={summary.isPending}
              value={formatDateTime(summary.data?.finishedAt)}
              description={formatRelative(summary.data?.finishedAt)}
            />
          </>
        )}
      </section>

      {summary.isPending && (
        <div aria-busy="true" className="grid gap-4 md:grid-cols-2">
          <Skeleton className="h-48" />
          <Skeleton className="h-48" />
        </div>
      )}
      {summary.data && summary.data.analysisId !== null && <SummaryPanel summary={summary.data} />}
    </div>
  )
}
