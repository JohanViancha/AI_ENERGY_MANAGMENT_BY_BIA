export const LOCALE = 'es-CO'

export const EMPTY_VALUE = '—'

type Nullable<T> = T | null | undefined

const RELATIVE_UNITS: { unit: Intl.RelativeTimeFormatUnit; seconds: number }[] = [
  { unit: 'year', seconds: 365 * 24 * 3600 },
  { unit: 'month', seconds: 30 * 24 * 3600 },
  { unit: 'day', seconds: 24 * 3600 },
  { unit: 'hour', seconds: 3600 },
  { unit: 'minute', seconds: 60 },
]

/** Formatea un número con separadores `es-CO`; `null` se muestra como `—`. */
export function formatNumber(value: Nullable<number>, digits = 0): string {
  if (value === null || value === undefined || Number.isNaN(value)) return EMPTY_VALUE
  return new Intl.NumberFormat(LOCALE, {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(value)
}

/** Formatea energía con un decimal: `1.234,5 kWh`. */
export function formatKwh(value: Nullable<number>): string {
  if (value === null || value === undefined || Number.isNaN(value)) return EMPTY_VALUE
  return `${formatNumber(value, 1)} kWh`
}

/** Convierte una fracción 0-1 en porcentaje: `0.87` → `87 %`. */
export function formatPercent(fraction: Nullable<number>, digits = 0): string {
  if (fraction === null || fraction === undefined || Number.isNaN(fraction)) return EMPTY_VALUE
  return `${formatNumber(fraction * 100, digits)} %`
}

/** Formatea fecha y hora en la zona horaria del navegador. */
export function formatDateTime(iso: Nullable<string>): string {
  if (!iso) return EMPTY_VALUE
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return EMPTY_VALUE
  return new Intl.DateTimeFormat(LOCALE, {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  }).format(date)
}

/** Formato corto para los ejes de los gráficos (`29 sep, 14:00`), en la zona del navegador. */
export function formatAxisDateTime(timestamp: number): string {
  return new Intl.DateTimeFormat(LOCALE, {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  }).format(new Date(timestamp))
}

/**
 * Formatea una fecha relativa a `now` (p. ej. "hace 3 h"). Solo para tarjetas: en tablas
 * y tooltips se usa `formatDateTime`, que no cambia con el tiempo.
 */
export function formatRelative(iso: Nullable<string>, now: number = Date.now()): string {
  if (!iso) return EMPTY_VALUE
  const timestamp = new Date(iso).getTime()
  if (Number.isNaN(timestamp)) return EMPTY_VALUE

  const diffSeconds = Math.round((timestamp - now) / 1000)
  const absSeconds = Math.abs(diffSeconds)
  const formatter = new Intl.RelativeTimeFormat(LOCALE, { numeric: 'auto', style: 'short' })

  const match = RELATIVE_UNITS.find(({ seconds }) => absSeconds >= seconds)
  if (!match) return formatter.format(diffSeconds, 'second')
  return formatter.format(Math.trunc(diffSeconds / match.seconds), match.unit)
}
