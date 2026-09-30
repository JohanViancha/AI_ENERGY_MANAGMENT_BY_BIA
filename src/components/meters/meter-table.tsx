import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react'
import type { KeyboardEvent } from 'react'
import { useNavigate } from 'react-router-dom'

import type { MeterListParams, MeterSortKey } from '@/components/meters/meter-list-params'
import { MeterStatusBadge } from '@/components/meters/meter-status-badge'
import { getMeterStatus } from '@/components/meters/meter-status'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { formatDateTime, formatKwh, formatNumber } from '@/lib/format'
import type { MeterSummary } from '@/types/meter'

const SORT_ICONS = { asc: ArrowUp, desc: ArrowDown } as const

interface SortableHeadProps {
  label: string
  sortKey: MeterSortKey
  params: MeterListParams
  onSort: (sort: MeterSortKey) => void
}

function SortableHead({ label, sortKey, params, onSort }: SortableHeadProps) {
  const isActive = params.sort === sortKey
  const Icon = isActive ? SORT_ICONS[params.dir] : ArrowUpDown
  const ariaSort = isActive ? (params.dir === 'asc' ? 'ascending' : 'descending') : 'none'

  return (
    <TableHead aria-sort={ariaSort}>
      <button
        type="button"
        onClick={() => onSort(sortKey)}
        className="inline-flex items-center gap-1 rounded-sm hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        {label}
        <Icon className="h-3.5 w-3.5" aria-hidden="true" />
      </button>
    </TableHead>
  )
}

export interface MeterTableProps {
  meters: MeterSummary[]
  params: MeterListParams
  onSort: (sort: MeterSortKey) => void
}

/** Tabla de medidores con encabezados ordenables y filas que abren el detalle. */
export function MeterTable({ meters, params, onSort }: MeterTableProps) {
  const navigate = useNavigate()

  function openDetail(meterId: string) {
    navigate(`/meters/${encodeURIComponent(meterId)}`)
  }

  function handleRowKeyDown(event: KeyboardEvent<HTMLTableRowElement>, meterId: string) {
    if (event.key === 'Enter') openDetail(meterId)
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <SortableHead label="Medidor" sortKey="meterId" params={params} onSort={onSort} />
          <TableHead>Estado</TableHead>
          <SortableHead
            label="Consumo actual"
            sortKey="lastConsumptionKwh"
            params={params}
            onSort={onSort}
          />
          <SortableHead
            label="Anomalías abiertas"
            sortKey="openAnomaliesCount"
            params={params}
            onSort={onSort}
          />
          <SortableHead
            label="Última lectura"
            sortKey="lastReadingAt"
            params={params}
            onSort={onSort}
          />
        </TableRow>
      </TableHeader>
      <TableBody>
        {meters.map((meter) => (
          <TableRow
            key={meter.meterId}
            tabIndex={0}
            onClick={() => openDetail(meter.meterId)}
            onKeyDown={(event) => handleRowKeyDown(event, meter.meterId)}
            className="cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
          >
            <TableCell className="font-medium">{meter.meterId}</TableCell>
            <TableCell>
              <MeterStatusBadge status={getMeterStatus(meter)} />
            </TableCell>
            <TableCell>{formatKwh(meter.lastConsumptionKwh)}</TableCell>
            <TableCell>{formatNumber(meter.openAnomaliesCount)}</TableCell>
            <TableCell>{formatDateTime(meter.lastReadingAt)}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
