import { isAxiosError } from 'axios'
import { ClipboardList, Gauge, SearchX } from 'lucide-react'
import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'

import { RecentAnomaliesTable } from '@/components/anomalies/recent-anomalies-table'
import { ConsumptionChart } from '@/components/charts/consumption-chart'
import { MetricChart } from '@/components/charts/metric-chart'
import { MeterSummaryCards } from '@/components/meters/meter-summary-cards'
import { EmptyState } from '@/components/shared/empty-state'
import { ErrorState } from '@/components/shared/error-state'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useMeter } from '@/hooks/use-meter'
import { useMeterAnomalies } from '@/hooks/use-meter-anomalies'
import { useMeterReadings } from '@/hooks/use-meter-readings'
import { formatNumber } from '@/lib/format'
import {
  DEFAULT_METER_RANGE,
  getRangeWindow,
  METER_RANGE_OPTIONS,
  type MeterRange,
} from '@/pages/meter-detail/meter-ranges'

const CHART_SKELETON_COUNT = 4

/** Pantalla protegida `/meters/:meterId`: resumen, gráficos por rango y anomalías recientes. */
export function MeterDetailPage() {
  const { meterId } = useParams<{ meterId: string }>()
  const [range, setRange] = useState<MeterRange>(DEFAULT_METER_RANGE)

  const meter = useMeter(meterId)
  const lastReadingAt = meter.data?.lastReadingAt ?? null
  const rangeWindow = lastReadingAt ? getRangeWindow(lastReadingAt, range) : null

  const readings = useMeterReadings({
    meterId,
    from: rangeWindow?.from ?? '',
    to: rangeWindow?.to ?? '',
  })
  const anomalies = useMeterAnomalies(meterId, meter.data?.lastAnalysisId)

  if (meter.isError && !meter.data) {
    if (isAxiosError(meter.error) && meter.error.response?.status === 404) {
      return (
        <EmptyState
          icon={SearchX}
          title="Medidor no encontrado"
          description={`No existe un medidor con el identificador ${meterId}.`}
          action={
            <Button asChild variant="outline">
              <Link to="/meters">Volver a medidores</Link>
            </Button>
          }
        />
      )
    }
    return (
      <ErrorState
        title="No se pudo cargar el medidor"
        onRetry={() => void meter.refetch()}
      />
    )
  }

  const rangeOption = METER_RANGE_OPTIONS.find((option) => option.value === range)
  const anomalyList = anomalies.data ?? []

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">{meterId}</h1>

      {meter.data ? (
        <MeterSummaryCards meter={meter.data} />
      ) : (
        <div aria-busy="true" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {Array.from({ length: 5 }, (_, index) => (
            <Skeleton key={index} className="h-28" />
          ))}
        </div>
      )}

      {meter.data && lastReadingAt === null ? (
        <EmptyState
          icon={Gauge}
          title="Sin lecturas"
          description="Este medidor todavía no tiene lecturas registradas."
        />
      ) : (
        <section aria-label="Lecturas" className="space-y-4">
          <Tabs value={range} onValueChange={(value) => setRange(value as MeterRange)}>
            <TabsList aria-label="Rango de tiempo">
              {METER_RANGE_OPTIONS.map((option) => (
                <TabsTrigger key={option.value} value={option.value}>
                  {option.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>

          {readings.isError && !readings.data ? (
            <ErrorState
              title="No se pudieron cargar las lecturas"
              onRetry={() => void readings.refetch()}
            />
          ) : !readings.data ? (
            <div aria-busy="true" className="grid gap-4 lg:grid-cols-2">
              {Array.from({ length: CHART_SKELETON_COUNT }, (_, index) => (
                <Skeleton key={index} className="h-80" />
              ))}
            </div>
          ) : (
            <div className="grid gap-4 lg:grid-cols-2">
              <ConsumptionChart
                data={readings.data.data}
                anomalies={anomalyList}
                ariaLabel={`Consumo en kWh de ${meterId} en ${rangeOption?.description}, con las ventanas de anomalía sombreadas`}
              />
              <MetricChart
                title="Voltaje (V)"
                metric="voltage"
                data={readings.data.data}
                formatValue={(value) => `${formatNumber(value, 1)} V`}
                ariaLabel={`Voltaje de ${meterId} en ${rangeOption?.description}`}
              />
              <MetricChart
                title="Corriente (A)"
                metric="current"
                data={readings.data.data}
                formatValue={(value) => `${formatNumber(value, 1)} A`}
                ariaLabel={`Corriente de ${meterId} en ${rangeOption?.description}`}
              />
              <MetricChart
                title="Factor de potencia"
                metric="powerFactor"
                data={readings.data.data}
                formatValue={(value) => formatNumber(value, 2)}
                ariaLabel={`Factor de potencia de ${meterId} en ${rangeOption?.description}`}
              />
            </div>
          )}
        </section>
      )}

      <section aria-label="Anomalías recientes" className="space-y-3">
        <h2 className="text-lg font-semibold">Anomalías recientes</h2>
        {!meter.data ? (
          <Skeleton aria-busy="true" className="h-40 w-full" />
        ) : meter.data.lastAnalysisId === null ? (
          <EmptyState
            icon={ClipboardList}
            title="Este medidor aún no tiene análisis"
            description="Las anomalías aparecerán cuando se ejecute un análisis de IA."
          />
        ) : anomalies.isError && !anomalies.data ? (
          <ErrorState
            title="No se pudieron cargar las anomalías"
            onRetry={() => void anomalies.refetch()}
          />
        ) : !anomalies.data ? (
          <Skeleton aria-busy="true" className="h-40 w-full" />
        ) : anomalyList.length === 0 ? (
          <EmptyState
            icon={ClipboardList}
            title="Sin anomalías"
            description="La última corrida no detectó anomalías en este medidor."
          />
        ) : (
          <RecentAnomaliesTable anomalies={anomalyList} />
        )}
      </section>
    </div>
  )
}
