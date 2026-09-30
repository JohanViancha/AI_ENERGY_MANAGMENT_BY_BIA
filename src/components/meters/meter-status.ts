import type { MeterStatus, MeterSummary } from '@/types/meter'

export const METER_STATUS_LABELS: Record<MeterStatus, string> = {
  OK: 'Normal',
  ALERT: 'Alerta',
  CRITICAL: 'Crítico',
}

/**
 * El backend no devuelve un estado por medidor, solo contadores; se deriva aquí.
 * CRITICAL si hay anomalías abiertas de severidad alta, ALERT si hay alguna abierta.
 */
export function getMeterStatus(meter: MeterSummary): MeterStatus {
  if (meter.highSeverityOpenCount > 0) return 'CRITICAL'
  if (meter.openAnomaliesCount > 0) return 'ALERT'
  return 'OK'
}
