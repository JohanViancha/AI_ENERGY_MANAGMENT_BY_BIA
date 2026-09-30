import { SEVERITY_LABELS } from '@/components/anomalies/anomaly-labels'
import { Badge, type BadgeProps } from '@/components/ui/badge'
import type { AnomalySeverity } from '@/types/anomaly'

const SEVERITY_VARIANTS: Record<AnomalySeverity, NonNullable<BadgeProps['variant']>> = {
  LOW: 'secondary',
  MEDIUM: 'outline',
  HIGH: 'destructive',
}

export interface SeverityBadgeProps {
  severity: AnomalySeverity
}

/** Etiqueta de severidad de una anomalía (Baja / Media / Alta). */
export function SeverityBadge({ severity }: SeverityBadgeProps) {
  return <Badge variant={SEVERITY_VARIANTS[severity]}>{SEVERITY_LABELS[severity]}</Badge>
}
