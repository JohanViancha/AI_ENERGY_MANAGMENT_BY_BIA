import { LineChart as LineChartIcon } from 'lucide-react'
import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceArea,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

import {
  CHART_COLORS,
  CHART_HEIGHT_CLASS,
  toChartPoints,
} from '@/components/charts/chart-data'
import { ChartTooltip } from '@/components/charts/chart-tooltip'
import { EmptyState } from '@/components/shared/empty-state'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatAxisDateTime, formatKwh } from '@/lib/format'
import type { Anomaly } from '@/types/anomaly'
import type { Reading } from '@/types/reading'

export interface ConsumptionChartProps {
  data: Reading[]
  anomalies: Anomaly[]
  ariaLabel: string
}

/** Consumo en kWh con la ventana de cada anomalía del medidor sombreada. */
export function ConsumptionChart({ data, anomalies, ariaLabel }: ConsumptionChartProps) {
  const points = toChartPoints(data, 'consumptionKwh')

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Consumo (kWh)</CardTitle>
      </CardHeader>
      <CardContent>
        {points.length === 0 ? (
          <div className={CHART_HEIGHT_CLASS}>
            <EmptyState
              icon={LineChartIcon}
              title="Sin lecturas"
              description="No hay lecturas en el rango seleccionado."
            />
          </div>
        ) : (
          <div role="img" aria-label={ariaLabel} className={CHART_HEIGHT_CLASS}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={points} margin={{ top: 8, right: 16, bottom: 0, left: 0 }}>
                <CartesianGrid stroke={CHART_COLORS.grid} strokeDasharray="3 3" />
                <XAxis
                  dataKey="time"
                  type="number"
                  scale="time"
                  domain={['dataMin', 'dataMax']}
                  tickFormatter={formatAxisDateTime}
                  stroke={CHART_COLORS.axis}
                  fontSize={12}
                  minTickGap={48}
                />
                <YAxis
                  domain={[0, 'auto']}
                  tickFormatter={formatKwh}
                  stroke={CHART_COLORS.axis}
                  fontSize={12}
                  width={72}
                />
                {anomalies.map((anomaly) => (
                  <ReferenceArea
                    key={anomaly.id}
                    x1={new Date(anomaly.evidence.windowStart).getTime()}
                    x2={new Date(anomaly.evidence.windowEnd).getTime()}
                    ifOverflow="hidden"
                    fill={CHART_COLORS.anomaly}
                    fillOpacity={0.15}
                    stroke="none"
                  />
                ))}
                <Tooltip content={(props) => <ChartTooltip {...props} formatValue={formatKwh} />} />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke={CHART_COLORS.line}
                  strokeWidth={2}
                  dot={false}
                  isAnimationActive={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
