import { AnomalyTypeBadge } from '@/components/anomalies/anomaly-type-badge'
import { SeverityBadge } from '@/components/anomalies/severity-badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { EMPTY_VALUE, formatDateTime, formatPercent } from '@/lib/format'
import type { Anomaly } from '@/types/anomaly'

export const RECENT_ANOMALIES_LIMIT = 5

export interface RecentAnomaliesTableProps {
  anomalies: Anomaly[]
}

/** Las anomalías más recientes por `detectedAt`, solo lectura: sin enlace a investigación. */
export function RecentAnomaliesTable({ anomalies }: RecentAnomaliesTableProps) {
  const recent = [...anomalies]
    .sort((a, b) => new Date(b.detectedAt).getTime() - new Date(a.detectedAt).getTime())
    .slice(0, RECENT_ANOMALIES_LIMIT)

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Severidad</TableHead>
          <TableHead>Tipo</TableHead>
          <TableHead>Confianza</TableHead>
          <TableHead>Detectada</TableHead>
          <TableHead>Motivo</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {recent.map((anomaly) => (
          <TableRow key={anomaly.id}>
            <TableCell>
              <SeverityBadge severity={anomaly.severity} />
            </TableCell>
            <TableCell>
              <AnomalyTypeBadge type={anomaly.type} />
            </TableCell>
            <TableCell>{formatPercent(anomaly.confidence)}</TableCell>
            <TableCell>{formatDateTime(anomaly.detectedAt)}</TableCell>
            <TableCell className="max-w-md">{anomaly.reason ?? EMPTY_VALUE}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
