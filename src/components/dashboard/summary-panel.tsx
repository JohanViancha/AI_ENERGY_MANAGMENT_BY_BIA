import type { ReactNode } from 'react'

import { ANOMALY_TYPE_LABELS } from '@/components/anomalies/anomaly-labels'
import { AnomalyTypeBadge } from '@/components/anomalies/anomaly-type-badge'
import { SeverityBadge } from '@/components/anomalies/severity-badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatNumber } from '@/lib/format'
import type { AnomalySeverity, AnomalyType } from '@/types/anomaly'
import type { DashboardSummary } from '@/types/dashboard'

const SEVERITY_ORDER: AnomalySeverity[] = ['HIGH', 'MEDIUM', 'LOW']
const TYPE_ORDER = Object.keys(ANOMALY_TYPE_LABELS) as AnomalyType[]

export interface SummaryPanelProps {
  summary: DashboardSummary
}

interface CountRowProps {
  label: ReactNode
  count: number
}

function CountRow({ label, count }: CountRowProps) {
  return (
    <li className="flex items-center justify-between">
      {label}
      <span className="text-sm font-medium tabular-nums">{formatNumber(count)}</span>
    </li>
  )
}

/** Panel con las anomalías de la última corrida agrupadas por severidad y por tipo. */
export function SummaryPanel({ summary }: SummaryPanelProps) {
  // El backend puede traer tipos que el frontend aún no conoce; se listan sin badge.
  const unknownTypes = Object.keys(summary.byType).filter(
    (type) => !TYPE_ORDER.includes(type as AnomalyType),
  )

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Anomalías por severidad</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-3">
            {SEVERITY_ORDER.map((severity) => (
              <CountRow
                key={severity}
                label={<SeverityBadge severity={severity} />}
                count={summary.bySeverity[severity] ?? 0}
              />
            ))}
          </ul>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Anomalías por tipo</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-3">
            {TYPE_ORDER.map((type) => (
              <CountRow
                key={type}
                label={<AnomalyTypeBadge type={type} />}
                count={summary.byType[type] ?? 0}
              />
            ))}
            {unknownTypes.map((type) => (
              <CountRow
                key={type}
                label={<span className="text-sm">{type}</span>}
                count={summary.byType[type]}
              />
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}
