import { getMeterStatus } from '@/components/meters/meter-status'
import type { MeterStatus, MeterSummary } from '@/types/meter'

export type MeterSortKey =
  | 'meterId'
  | 'lastConsumptionKwh'
  | 'openAnomaliesCount'
  | 'lastReadingAt'
export type MeterStatusFilter = 'ALL' | MeterStatus
export type SortDirection = 'asc' | 'desc'

export interface MeterListParams {
  status: MeterStatusFilter
  q: string
  sort: MeterSortKey
  dir: SortDirection
}

export const DEFAULT_METER_LIST_PARAMS: MeterListParams = {
  status: 'ALL',
  q: '',
  sort: 'meterId',
  dir: 'asc',
}

const STATUS_FILTERS: MeterStatusFilter[] = ['ALL', 'OK', 'ALERT', 'CRITICAL']
const SORT_KEYS: MeterSortKey[] = [
  'meterId',
  'lastConsumptionKwh',
  'openAnomaliesCount',
  'lastReadingAt',
]

/** Lee los query params de la URL; cualquier valor inválido cae al default. */
export function parseMeterListParams(searchParams: URLSearchParams): MeterListParams {
  const status = searchParams.get('status')
  const sort = searchParams.get('sort')
  const dir = searchParams.get('dir')

  return {
    status: STATUS_FILTERS.includes(status as MeterStatusFilter)
      ? (status as MeterStatusFilter)
      : DEFAULT_METER_LIST_PARAMS.status,
    q: searchParams.get('q') ?? DEFAULT_METER_LIST_PARAMS.q,
    sort: SORT_KEYS.includes(sort as MeterSortKey)
      ? (sort as MeterSortKey)
      : DEFAULT_METER_LIST_PARAMS.sort,
    dir: dir === 'asc' || dir === 'desc' ? dir : DEFAULT_METER_LIST_PARAMS.dir,
  }
}

/** Serializa los params omitiendo los que valen el default, para una URL corta. */
export function serializeMeterListParams(params: MeterListParams): URLSearchParams {
  const searchParams = new URLSearchParams()
  const entries = Object.entries(params) as [keyof MeterListParams, string][]
  for (const [key, value] of entries) {
    if (value !== DEFAULT_METER_LIST_PARAMS[key]) searchParams.set(key, value)
  }
  return searchParams
}

/** Pulsar la columna activa invierte el orden; pulsar otra la ordena ascendente. */
export function toggleMeterSort(params: MeterListParams, sort: MeterSortKey): MeterListParams {
  if (params.sort === sort) return { ...params, dir: params.dir === 'asc' ? 'desc' : 'asc' }
  return { ...params, sort, dir: 'asc' }
}

export function matchesMeterSearch(meter: MeterSummary, q: string): boolean {
  const query = q.trim().toLowerCase()
  return query === '' || meter.meterId.toLowerCase().includes(query)
}

function compareValues(a: MeterSummary, b: MeterSummary, sort: MeterSortKey): number {
  switch (sort) {
    case 'meterId':
      return a.meterId.localeCompare(b.meterId, undefined, { numeric: true })
    case 'lastReadingAt':
      return (
        new Date(a.lastReadingAt as string).getTime() -
        new Date(b.lastReadingAt as string).getTime()
      )
    default:
      return (a[sort] as number) - (b[sort] as number)
  }
}

/** Filtra por estado, busca por `meterId` sin distinguir mayúsculas y ordena; `null` va al final. */
export function applyMeterListParams(
  meters: MeterSummary[],
  params: MeterListParams,
): MeterSummary[] {
  const direction = params.dir === 'asc' ? 1 : -1

  return meters
    .filter((meter) => params.status === 'ALL' || getMeterStatus(meter) === params.status)
    .filter((meter) => matchesMeterSearch(meter, params.q))
    .sort((a, b) => {
      const aIsNull = a[params.sort] === null
      const bIsNull = b[params.sort] === null
      if (aIsNull || bIsNull) return Number(aIsNull) - Number(bIsNull)
      const result = compareValues(a, b, params.sort) * direction
      // Desempate estable por meterId para que valores iguales no dependan del orden de entrada.
      return result !== 0 ? result : compareValues(a, b, 'meterId')
    })
}
