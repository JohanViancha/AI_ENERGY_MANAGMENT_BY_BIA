import { ANOMALY_TYPE_LABELS, SEVERITY_LABELS } from '@/components/anomalies/anomaly-labels'
import {
  SEVERITY_FILTERS,
  TYPE_FILTERS,
  type AnomalyListParams,
  type SeverityFilter,
  type TypeFilter,
} from '@/components/anomalies/anomaly-list-params'
import { Label } from '@/components/ui/label'

const SELECT_CLASS =
  'h-10 rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'

export interface AnomalyFiltersProps {
  params: AnomalyListParams
  /** Medidores con anomalías en la corrida; las opciones salen de los datos. */
  meterIds: string[]
  onChange: (params: AnomalyListParams) => void
}

/** Selects de severidad, tipo y medidor, cada uno con la opción "Todos". */
export function AnomalyFilters({ params, meterIds, onChange }: AnomalyFiltersProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
      <div className="space-y-1.5">
        <Label htmlFor="anomaly-severity">Severidad</Label>
        <select
          id="anomaly-severity"
          value={params.severity}
          onChange={(event) =>
            onChange({
              ...params,
              severity: event.target.value as SeverityFilter,
            })
          }
          className={SELECT_CLASS}
        >
          {SEVERITY_FILTERS.map((value) => (
            <option key={value} value={value}>
              {value === 'ALL' ? 'Todos' : SEVERITY_LABELS[value]}
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="anomaly-type">Tipo</Label>
        <select
          id="anomaly-type"
          value={params.type}
          onChange={(event) => onChange({ ...params, type: event.target.value as TypeFilter })}
          className={SELECT_CLASS}
        >
          {TYPE_FILTERS.map((value) => (
            <option key={value} value={value}>
              {value === 'ALL' ? 'Todos' : ANOMALY_TYPE_LABELS[value]}
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="anomaly-meter">Medidor</Label>
        <select
          id="anomaly-meter"
          value={params.meterId}
          onChange={(event) => onChange({ ...params, meterId: event.target.value })}
          className={SELECT_CLASS}
        >
          <option value="">Todos</option>
          {meterIds.map((meterId) => (
            <option key={meterId} value={meterId}>
              {meterId}
            </option>
          ))}
        </select>
      </div>
    </div>
  )
}
