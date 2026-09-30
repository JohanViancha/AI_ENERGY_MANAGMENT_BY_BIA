import { describe, expect, it } from 'vitest'

import { getMeterStatus } from '@/components/meters/meter-status'
import type { MeterSummary } from '@/types/meter'

function buildMeter(overrides: Partial<MeterSummary>): MeterSummary {
  return {
    meterId: 'M-101',
    lastReadingAt: '2026-09-29T12:00:00.000Z',
    lastConsumptionKwh: 10,
    openAnomaliesCount: 0,
    highSeverityOpenCount: 0,
    ...overrides,
  }
}

describe('getMeterStatus', () => {
  it('devuelve CRITICAL cuando hay anomalías abiertas de severidad alta', () => {
    expect(getMeterStatus(buildMeter({ openAnomaliesCount: 3, highSeverityOpenCount: 1 }))).toBe(
      'CRITICAL',
    )
  })

  it('devuelve ALERT cuando hay anomalías abiertas pero ninguna de severidad alta', () => {
    expect(getMeterStatus(buildMeter({ openAnomaliesCount: 2, highSeverityOpenCount: 0 }))).toBe(
      'ALERT',
    )
  })

  it('devuelve OK con los dos contadores en 0', () => {
    expect(getMeterStatus(buildMeter({}))).toBe('OK')
  })

  it('prioriza la severidad alta aunque el total abierto sea 0', () => {
    expect(getMeterStatus(buildMeter({ openAnomaliesCount: 0, highSeverityOpenCount: 1 }))).toBe(
      'CRITICAL',
    )
  })
})
