import { describe, expect, it } from 'vitest'

import {
  applyMeterListParams,
  DEFAULT_METER_LIST_PARAMS,
  parseMeterListParams,
  serializeMeterListParams,
  toggleMeterSort,
  type MeterListParams,
} from '@/components/meters/meter-list-params'
import type { MeterSummary } from '@/types/meter'

function buildMeter(overrides: Partial<MeterSummary> & { meterId: string }): MeterSummary {
  return {
    lastReadingAt: '2026-09-29T12:00:00.000Z',
    lastConsumptionKwh: 10,
    openAnomaliesCount: 0,
    highSeverityOpenCount: 0,
    ...overrides,
  }
}

const meters: MeterSummary[] = [
  buildMeter({ meterId: 'M-102', lastConsumptionKwh: 50, openAnomaliesCount: 2 }),
  buildMeter({
    meterId: 'M-101',
    lastConsumptionKwh: 20,
    openAnomaliesCount: 1,
    highSeverityOpenCount: 1,
  }),
  buildMeter({ meterId: 'M-110', lastConsumptionKwh: null, lastReadingAt: null }),
  buildMeter({ meterId: 'M-103', lastConsumptionKwh: 5 }),
]

function apply(overrides: Partial<MeterListParams>) {
  return applyMeterListParams(meters, { ...DEFAULT_METER_LIST_PARAMS, ...overrides }).map(
    (meter) => meter.meterId,
  )
}

describe('applyMeterListParams', () => {
  it('ordena por meterId ascendente por defecto', () => {
    expect(apply({})).toEqual(['M-101', 'M-102', 'M-103', 'M-110'])
  })

  it('no modifica el arreglo original', () => {
    apply({ dir: 'desc' })

    expect(meters.map((meter) => meter.meterId)).toEqual(['M-102', 'M-101', 'M-110', 'M-103'])
  })

  it('filtra por estado', () => {
    expect(apply({ status: 'CRITICAL' })).toEqual(['M-101'])
    expect(apply({ status: 'ALERT' })).toEqual(['M-102'])
    expect(apply({ status: 'OK' })).toEqual(['M-103', 'M-110'])
  })

  it('busca por meterId sin distinguir mayúsculas', () => {
    expect(apply({ q: 'm-10' })).toEqual(['M-101', 'M-102', 'M-103'])
    expect(apply({ q: '  M-110 ' })).toEqual(['M-110'])
  })

  it('combina estado y búsqueda', () => {
    expect(apply({ status: 'OK', q: 'm-10' })).toEqual(['M-103'])
  })

  it('devuelve una lista vacía cuando nada coincide', () => {
    expect(apply({ q: 'zzz' })).toEqual([])
  })

  it('ordena numéricamente asc y desc', () => {
    expect(apply({ sort: 'openAnomaliesCount', dir: 'desc' })).toEqual([
      'M-102',
      'M-101',
      'M-103',
      'M-110',
    ])
    expect(apply({ sort: 'openAnomaliesCount', dir: 'asc' }).slice(-2)).toEqual([
      'M-101',
      'M-102',
    ])
  })

  it('deja los null al final en ambos sentidos', () => {
    expect(apply({ sort: 'lastConsumptionKwh', dir: 'asc' })).toEqual([
      'M-103',
      'M-101',
      'M-102',
      'M-110',
    ])
    expect(apply({ sort: 'lastConsumptionKwh', dir: 'desc' })).toEqual([
      'M-102',
      'M-101',
      'M-103',
      'M-110',
    ])
    expect(apply({ sort: 'lastReadingAt', dir: 'desc' }).at(-1)).toBe('M-110')
  })

  it('ordena por meterId de forma natural', () => {
    const result = applyMeterListParams(
      [buildMeter({ meterId: 'M-9' }), buildMeter({ meterId: 'M-10' })],
      DEFAULT_METER_LIST_PARAMS,
    )

    expect(result.map((meter) => meter.meterId)).toEqual(['M-9', 'M-10'])
  })
})

describe('parseMeterListParams', () => {
  it('lee los params válidos de la URL', () => {
    const params = parseMeterListParams(
      new URLSearchParams('status=CRITICAL&q=M-10&sort=lastConsumptionKwh&dir=desc'),
    )

    expect(params).toEqual({
      status: 'CRITICAL',
      q: 'M-10',
      sort: 'lastConsumptionKwh',
      dir: 'desc',
    })
  })

  it('cae a los defaults cuando la URL no trae nada', () => {
    expect(parseMeterListParams(new URLSearchParams())).toEqual(DEFAULT_METER_LIST_PARAMS)
  })

  it('cae al default con valores inválidos sin lanzar', () => {
    const params = parseMeterListParams(
      new URLSearchParams('status=BOGUS&sort=nope&dir=sideways'),
    )

    expect(params).toEqual(DEFAULT_METER_LIST_PARAMS)
  })
})

describe('serializeMeterListParams', () => {
  it('omite los valores por defecto', () => {
    expect(serializeMeterListParams(DEFAULT_METER_LIST_PARAMS).toString()).toBe('')
  })

  it('incluye solo lo que difiere del default', () => {
    const search = serializeMeterListParams({
      ...DEFAULT_METER_LIST_PARAMS,
      status: 'ALERT',
      q: 'm-1',
    })

    expect(search.get('status')).toBe('ALERT')
    expect(search.get('q')).toBe('m-1')
    expect(search.has('sort')).toBe(false)
  })
})

describe('toggleMeterSort', () => {
  it('invierte la dirección al pulsar la columna activa', () => {
    expect(toggleMeterSort(DEFAULT_METER_LIST_PARAMS, 'meterId').dir).toBe('desc')
  })

  it('ordena ascendente al cambiar de columna', () => {
    const next = toggleMeterSort({ ...DEFAULT_METER_LIST_PARAMS, dir: 'desc' }, 'lastReadingAt')

    expect(next.sort).toBe('lastReadingAt')
    expect(next.dir).toBe('asc')
  })
})
