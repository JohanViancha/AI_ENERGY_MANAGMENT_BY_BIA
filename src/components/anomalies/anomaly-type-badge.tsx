import { ANOMALY_TYPE_LABELS } from '@/components/anomalies/anomaly-labels'
import { Badge, type BadgeProps } from '@/components/ui/badge'
import type { AnomalyType } from '@/types/anomaly'

const TYPE_VARIANTS: Record<AnomalyType, NonNullable<BadgeProps['variant']>> = {
  REAL_ANOMALY: 'default',
  EXPLAINABLE_ANOMALY: 'secondary',
  FALSE_POSITIVE: 'outline',
  DATA_QUALITY: 'outline',
}

export interface AnomalyTypeBadgeProps {
  type: AnomalyType
}

/** Etiqueta del tipo de anomalía clasificado por la IA. */
export function AnomalyTypeBadge({ type }: AnomalyTypeBadgeProps) {
  return <Badge variant={TYPE_VARIANTS[type]}>{ANOMALY_TYPE_LABELS[type]}</Badge>
}
