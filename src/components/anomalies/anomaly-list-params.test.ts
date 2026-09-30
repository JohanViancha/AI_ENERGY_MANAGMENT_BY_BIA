import { describe, expect, it } from 'vitest'

import {
  applyAnomalyListParams,
  DEFAULT_ANOMALY_LIST_PARAMS,
  parseAnomalyListParams,
  serializeAnomalyListParams,
  type AnomalyListParams,
} from '@/components/anomalies/anomaly-list-params'
import type { Anomaly } from '@/types/anomaly'

function buildAnomaly(overrides: Partial<Anomaly> & { id: string }): Anomaly {
  return {
    meterId: 'M-101',
    analysisId: 'an-1',
    detectedAt: '2026-09-29T10:00:00.000Z',
    type: 'REAL_ANOMALY',
    severity: 'HIGH',
    confidence: 0.9,
    priorityScore: 50,
    status: 'OPEN',
    reason: null,
    recommendedAction: null,
    evidence: {
      baselineKwh: 1,
      observedKwh: 2,
      variationPct: 100,
      signals: [],
      windowStart: '2026-09-29T09:00:00.000Z',
      windowEnd: '2026-09-29T10:00:00.000Z',
      relatedEvents: [],
      detectorScores: {},
    },
    ...overrides,
  }
}

const anomalies: Anomaly[] = [
  buildAnomaly({
    id: 'a',
    priorityScore: 30,
    severity: 'LOW',
    type: 'DATA_QUALITY',
  }),
  buildAnomaly({ id: 'b', priorityScore: 90, meterId: 'M-109' }),
  buildAnomaly({
    id: 'c',
    priorityScore: 60,
    severity: 'MEDIUM',
    type: 'FALSE_POSITIVE',
  }),
  buildAnomaly({
    id: 'd',
    priorityScore: 90,
    meterId: 'M-109',
    detectedAt: '2026-09-29T11:00:00Z',
  }),
  buildAnomaly({
    id: 'e',
    priorityScore: 90,
    meterId: 'M-109',
    detectedAt: '2026-09-29T11:00:00Z',
  }),
]

function apply(overrides: Partial<AnomalyListParams>) {
  return applyAnomalyListParams(anomalies, {
    ...DEFAULT_ANOMALY_LIST_PARAMS,
    ...overrides,
  }).map((anomaly) => anomaly.id)
}

describe('applyAnomalyListParams', () => {
  it('ordena por priorityScore desc, luego detectedAt desc y luego id', () => {
    expect(apply({})).toEqual(['d', 'e', 'b', 'c', 'a'])
  })

  it('no modifica el arreglo original', () => {
    apply({})

    expect(anomalies.map((anomaly) => anomaly.id)).toEqual(['a', 'b', 'c', 'd', 'e'])
  })

  it('filtra por severidad', () => {
    expect(apply({ severity: 'HIGH' })).toEqual(['d', 'e', 'b'])
    expect(apply({ severity: 'MEDIUM' })).toEqual(['c'])
  })

  it('filtra por tipo', () => {
    expect(apply({ type: 'DATA_QUALITY' })).toEqual(['a'])
  })

  it('filtra por medidor', () => {
    expect(apply({ meterId: 'M-109' })).toEqual(['d', 'e', 'b'])
  })

  it('combina severidad, tipo y medidor a la vez', () => {
    expect(apply({ severity: 'HIGH', type: 'REAL_ANOMALY', meterId: 'M-109' })).toEqual([
      'd',
      'e',
      'b',
    ])
    expect(apply({ severity: 'LOW', meterId: 'M-109' })).toEqual([])
  })
})

describe('parseAnomalyListParams', () => {
  it('lee los filtros de la URL', () => {
    const params = parseAnomalyListParams(
      new URLSearchParams('severity=HIGH&type=REAL_ANOMALY&meterId=M-109'),
    )

    expect(params).toEqual({
      severity: 'HIGH',
      type: 'REAL_ANOMALY',
      meterId: 'M-109',
    })
  })

  it('cae a los defaults con valores inválidos o ausentes', () => {
    expect(parseAnomalyListParams(new URLSearchParams('severity=CRITICAL&type=x'))).toEqual(
      DEFAULT_ANOMALY_LIST_PARAMS,
    )
    expect(parseAnomalyListParams(new URLSearchParams(''))).toEqual(DEFAULT_ANOMALY_LIST_PARAMS)
  })
})

describe('serializeAnomalyListParams', () => {
  it('omite los valores por defecto', () => {
    expect(serializeAnomalyListParams(DEFAULT_ANOMALY_LIST_PARAMS).toString()).toBe('')
    expect(
      serializeAnomalyListParams({
        severity: 'HIGH',
        type: 'ALL',
        meterId: 'M-109',
      }).toString(),
    ).toBe('severity=HIGH&meterId=M-109')
  })
})
