import { METER_STATUS_LABELS } from '@/components/meters/meter-status'
import { Badge, type BadgeProps } from '@/components/ui/badge'
import type { MeterStatus } from '@/types/meter'

const STATUS_VARIANTS: Record<MeterStatus, NonNullable<BadgeProps['variant']>> = {
  OK: 'secondary',
  ALERT: 'outline',
  CRITICAL: 'destructive',
}

export interface MeterStatusBadgeProps {
  status: MeterStatus
}

/** Etiqueta del estado derivado de un medidor (Normal / Alerta / Crítico). */
export function MeterStatusBadge({ status }: MeterStatusBadgeProps) {
  return <Badge variant={STATUS_VARIANTS[status]}>{METER_STATUS_LABELS[status]}</Badge>
}
