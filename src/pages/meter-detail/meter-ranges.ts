export type MeterRange = '24h' | '7d' | '14d'

export const DEFAULT_METER_RANGE: MeterRange = '7d'

interface MeterRangeOption {
  value: MeterRange
  label: string
  description: string
  hours: number
}

export const METER_RANGE_OPTIONS: MeterRangeOption[] = [
  { value: '24h', label: '24 h', description: 'las últimas 24 horas', hours: 24 },
  { value: '7d', label: '7 d', description: 'los últimos 7 días', hours: 7 * 24 },
  { value: '14d', label: '14 d', description: 'los últimos 14 días', hours: 14 * 24 },
]

const MS_PER_HOUR = 3_600_000

export interface RangeWindow {
  from: string
  to: string
}

/**
 * El rango se ancla en la última lectura del medidor y no en la fecha actual: el dataset
 * sembrado termina en septiembre de 2026 y "ahora" no tendría lecturas.
 */
export function getRangeWindow(lastReadingAt: string, range: MeterRange): RangeWindow {
  const option = METER_RANGE_OPTIONS.find((candidate) => candidate.value === range)
  const to = new Date(lastReadingAt)
  const from = new Date(to.getTime() - (option?.hours ?? 0) * MS_PER_HOUR)
  return { from: from.toISOString(), to: to.toISOString() }
}
