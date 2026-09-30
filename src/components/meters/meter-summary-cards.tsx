import type { ReactNode } from 'react'

import { MeterStatusBadge } from '@/components/meters/meter-status-badge'
import { getMeterStatus } from '@/components/meters/meter-status'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatDateTime, formatKwh, formatNumber, formatRelative } from '@/lib/format'
import type { MeterDetail } from '@/types/meter'

interface SummaryCardProps {
  title: string
  children: ReactNode
  description?: string
}

function SummaryCard({ title, children, description }: SummaryCardProps) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex h-8 items-center text-xl font-semibold">{children}</div>
        <p className="mt-2 h-4 text-xs text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  )
}

export interface MeterSummaryCardsProps {
  meter: MeterDetail
}

/** Tarjetas de resumen del detalle: estado, última lectura, consumo, anomalías y lecturas. */
export function MeterSummaryCards({ meter }: MeterSummaryCardsProps) {
  return (
    <section
      aria-label="Resumen del medidor"
      className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5"
    >
      <SummaryCard title="Estado">
        <MeterStatusBadge status={getMeterStatus(meter)} />
      </SummaryCard>
      <SummaryCard title="Última lectura" description={formatRelative(meter.lastReadingAt)}>
        <span className="text-base">{formatDateTime(meter.lastReadingAt)}</span>
      </SummaryCard>
      <SummaryCard title="Consumo" description="Última lectura">
        {formatKwh(meter.lastConsumptionKwh)}
      </SummaryCard>
      <SummaryCard
        title="Anomalías abiertas"
        description={`${formatNumber(meter.highSeverityOpenCount)} de severidad alta`}
      >
        {formatNumber(meter.openAnomaliesCount)}
      </SummaryCard>
      <SummaryCard title="Total de lecturas">{formatNumber(meter.totalReadingsCount)}</SummaryCard>
    </section>
  )
}
