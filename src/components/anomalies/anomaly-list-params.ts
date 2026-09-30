import type { Anomaly, AnomalySeverity, AnomalyType } from '@/types/anomaly'

export type SeverityFilter = 'ALL' | AnomalySeverity
export type TypeFilter = 'ALL' | AnomalyType

export interface AnomalyListParams {
  severity: SeverityFilter
  type: TypeFilter
  meterId: string
}

export const DEFAULT_ANOMALY_LIST_PARAMS: AnomalyListParams = {
  severity: 'ALL',
  type: 'ALL',
  meterId: '',
}

export const SEVERITY_FILTERS: SeverityFilter[] = ['ALL', 'HIGH', 'MEDIUM', 'LOW']
export const TYPE_FILTERS: TypeFilter[] = [
  'ALL',
  'REAL_ANOMALY',
  'EXPLAINABLE_ANOMALY',
  'FALSE_POSITIVE',
  'DATA_QUALITY',
]

/** Lee los query params de la URL; cualquier valor inválido cae al default. */
export function parseAnomalyListParams(searchParams: URLSearchParams): AnomalyListParams {
  const severity = searchParams.get('severity')
  const type = searchParams.get('type')

  return {
    severity: SEVERITY_FILTERS.includes(severity as SeverityFilter)
      ? (severity as SeverityFilter)
      : DEFAULT_ANOMALY_LIST_PARAMS.severity,
    type: TYPE_FILTERS.includes(type as TypeFilter)
      ? (type as TypeFilter)
      : DEFAULT_ANOMALY_LIST_PARAMS.type,
    meterId: searchParams.get('meterId') ?? DEFAULT_ANOMALY_LIST_PARAMS.meterId,
  }
}

/** Serializa los params omitiendo los que valen el default, para una URL corta. */
export function serializeAnomalyListParams(params: AnomalyListParams): URLSearchParams {
  const searchParams = new URLSearchParams()
  const entries = Object.entries(params) as [keyof AnomalyListParams, string][]
  for (const [key, value] of entries) {
    if (value !== DEFAULT_ANOMALY_LIST_PARAMS[key]) searchParams.set(key, value)
  }
  return searchParams
}

/** Filtra por severidad, tipo y medidor; ordena por `priorityScore` desc, `detectedAt` desc e id. */
export function applyAnomalyListParams(anomalies: Anomaly[], params: AnomalyListParams): Anomaly[] {
  return anomalies
    .filter((anomaly) => params.severity === 'ALL' || anomaly.severity === params.severity)
    .filter((anomaly) => params.type === 'ALL' || anomaly.type === params.type)
    .filter((anomaly) => params.meterId === '' || anomaly.meterId === params.meterId)
    .sort(
      (a, b) =>
        b.priorityScore - a.priorityScore ||
        new Date(b.detectedAt).getTime() - new Date(a.detectedAt).getTime() ||
        a.id.localeCompare(b.id),
    )
}
