import { LineChart as LineChartIcon } from 'lucide-react'
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

import {
  CHART_COLORS,
  CHART_HEIGHT_CLASS,
  toChartPoints,
  type ReadingMetric,
} from '@/components/charts/chart-data'
import { ChartTooltip } from '@/components/charts/chart-tooltip'
import { EmptyState } from '@/components/shared/empty-state'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatAxisDateTime } from '@/lib/format'
import type { Reading } from '@/types/reading'

export interface MetricChartProps {
  title: string
  metric: ReadingMetric
  data: Reading[]
  formatValue: (value: number) => string
  ariaLabel: string
}

/** Línea genérica de una métrica de las lecturas (voltaje, corriente, factor de potencia). */
export function MetricChart({ title, metric, data, formatValue, ariaLabel }: MetricChartProps) {
  const points = toChartPoints(data, metric)

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">{title}</CardTitle>
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
                  domain={['auto', 'auto']}
                  tickFormatter={formatValue}
                  stroke={CHART_COLORS.axis}
                  fontSize={12}
                  width={72}
                />
                <Tooltip
                  content={(props) => <ChartTooltip {...props} formatValue={formatValue} />}
                />
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
