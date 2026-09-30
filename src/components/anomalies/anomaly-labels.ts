import type { AnomalySeverity, AnomalyType } from '@/types/anomaly'

export const SEVERITY_LABELS: Record<AnomalySeverity, string> = {
  LOW: 'Baja',
  MEDIUM: 'Media',
  HIGH: 'Alta',
}

export const ANOMALY_TYPE_LABELS: Record<AnomalyType, string> = {
  REAL_ANOMALY: 'Anomalía real',
  EXPLAINABLE_ANOMALY: 'Explicable',
  FALSE_POSITIVE: 'Falso positivo',
  DATA_QUALITY: 'Calidad de datos',
}
