import type { KeyboardEvent } from 'react'
import { useNavigate } from 'react-router-dom'

import { AnomalyTypeBadge } from '@/components/anomalies/anomaly-type-badge'
import { ConfidenceIndicator } from '@/components/anomalies/confidence-indicator'
import { SeverityBadge } from '@/components/anomalies/severity-badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { EMPTY_VALUE, formatDateTime, formatNumber } from '@/lib/format'
import type { Anomaly } from '@/types/anomaly'

export interface AnomalyTableProps {
  /** Ya filtradas y ordenadas por prioridad. */
  anomalies: Anomaly[]
}

/** Lista priorizada de anomalías; cada fila abre el expediente y se opera con teclado. */
export function AnomalyTable({ anomalies }: AnomalyTableProps) {
  const navigate = useNavigate()

  function openDetail(id: string) {
    navigate(`/anomalies/${encodeURIComponent(id)}`)
  }

  function handleRowKeyDown(event: KeyboardEvent<HTMLTableRowElement>, id: string) {
    if (event.key === 'Enter') openDetail(id)
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Prioridad</TableHead>
          <TableHead>Medidor</TableHead>
          <TableHead>Tipo</TableHead>
          <TableHead>Severidad</TableHead>
          <TableHead>Confianza</TableHead>
          <TableHead>Detectada</TableHead>
          <TableHead>Acción recomendada</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {anomalies.map((anomaly) => (
          <TableRow
            key={anomaly.id}
            tabIndex={0}
            onClick={() => openDetail(anomaly.id)}
            onKeyDown={(event) => handleRowKeyDown(event, anomaly.id)}
            className="cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
          >
            <TableCell className="font-medium tabular-nums">
              {formatNumber(anomaly.priorityScore, 1)}
            </TableCell>
            <TableCell>{anomaly.meterId}</TableCell>
            <TableCell>
              <AnomalyTypeBadge type={anomaly.type} />
            </TableCell>
            <TableCell>
              <SeverityBadge severity={anomaly.severity} />
            </TableCell>
            <TableCell>
              <ConfidenceIndicator confidence={anomaly.confidence} />
            </TableCell>
            <TableCell>{formatDateTime(anomaly.detectedAt)}</TableCell>
            <TableCell className="max-w-xs truncate" title={anomaly.recommendedAction ?? undefined}>
              {anomaly.recommendedAction ?? EMPTY_VALUE}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
