import type { TooltipContentProps } from 'recharts'

import { READING_STATUS_LABELS, type ChartPoint } from '@/components/charts/chart-data'
import { formatDateTime } from '@/lib/format'

export interface ChartTooltipProps extends TooltipContentProps {
  formatValue: (value: number) => string
}

/** Tooltip de lectura: fecha, valor y `status` (las lecturas ESTIMATED/INVALID se grafican tal cual). */
export function ChartTooltip({ active, payload, formatValue }: ChartTooltipProps) {
  const point = payload?.[0]?.payload as ChartPoint | undefined
  if (!active || !point) return null

  return (
    <div className="rounded-md border bg-background px-3 py-2 text-xs shadow-md">
      <p className="font-medium">{formatDateTime(new Date(point.time).toISOString())}</p>
      <p className="mt-1">{formatValue(point.value)}</p>
      <p className="text-muted-foreground">Lectura: {READING_STATUS_LABELS[point.status]}</p>
    </div>
  )
}
