import { Search } from 'lucide-react'

import type { MeterStatusFilter } from '@/components/meters/meter-list-params'
import { Input } from '@/components/ui/input'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'

const STATUS_TABS: { value: MeterStatusFilter; label: string }[] = [
  { value: 'ALL', label: 'Todos' },
  { value: 'OK', label: 'Normales' },
  { value: 'ALERT', label: 'Alertas' },
  { value: 'CRITICAL', label: 'Críticos' },
]

export interface MeterFiltersProps {
  status: MeterStatusFilter
  query: string
  counts: Record<MeterStatusFilter, number>
  onStatusChange: (status: MeterStatusFilter) => void
  onQueryChange: (query: string) => void
}

/** Tabs de estado con conteo y búsqueda por `meterId`. */
export function MeterFilters({
  status,
  query,
  counts,
  onStatusChange,
  onQueryChange,
}: MeterFiltersProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <Tabs value={status} onValueChange={(value) => onStatusChange(value as MeterStatusFilter)}>
        <TabsList aria-label="Filtrar por estado" className="h-auto flex-wrap">
          {STATUS_TABS.map((tab) => (
            <TabsTrigger key={tab.value} value={tab.value}>
              {tab.label} ({counts[tab.value]})
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
      <div className="relative w-full sm:w-64">
        <Search
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden="true"
        />
        <Input
          type="search"
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder="Buscar medidor"
          aria-label="Buscar medidor"
          className="pl-9"
        />
      </div>
    </div>
  )
}
