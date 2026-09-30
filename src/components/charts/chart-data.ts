import type { Reading, ReadingStatus } from '@/types/reading'

export const READING_STATUS_LABELS: Record<ReadingStatus, string> = {
  OK: 'Normal',
  ESTIMATED: 'Estimada',
  INVALID: 'Inválida',
}

export type ReadingMetric = 'consumptionKwh' | 'voltage' | 'current' | 'powerFactor'

export interface ChartPoint {
  /** Milisegundos epoch: el eje X numérico permite sombrear ventanas que no caen en una hora exacta. */
  time: number
  value: number
  status: ReadingStatus
}

/** Proyecta una métrica de las lecturas a puntos ordenados por tiempo. */
export function toChartPoints(readings: Reading[], metric: ReadingMetric): ChartPoint[] {
  return readings
    .map((reading) => ({
      time: new Date(reading.timestamp).getTime(),
      value: reading[metric],
      status: reading.status,
    }))
    .sort((a, b) => a.time - b.time)
}

/** Tokens del tema para Recharts, que no lee clases de Tailwind sino atributos SVG. */
export const CHART_COLORS = {
  line: 'hsl(var(--primary))',
  grid: 'hsl(var(--border))',
  axis: 'hsl(var(--muted-foreground))',
  anomaly: 'hsl(var(--destructive))',
} as const

export const CHART_HEIGHT_CLASS = 'h-64'
