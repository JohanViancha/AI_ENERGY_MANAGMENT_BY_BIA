import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'

import {
  formatAxisDateTime,
  formatDateTime,
  formatKwh,
  formatNumber,
  formatPercent,
  formatRelative,
} from '@/lib/format'

// Se fija la zona horaria para que los tests no dependan de la máquina que los ejecuta.
beforeAll(() => {
  vi.stubEnv('TZ', 'America/Bogota')
})

afterAll(() => {
  vi.unstubAllEnvs()
})

describe('formatNumber', () => {
  it('usa punto de miles y coma decimal', () => {
    expect(formatNumber(1234.5, 1)).toBe('1.234,5')
  })

  it('respeta la cantidad de decimales pedida', () => {
    expect(formatNumber(3, 2)).toBe('3,00')
    expect(formatNumber(3.456)).toBe('3')
  })

  it.each([null, undefined])('muestra — para %s', (value) => {
    expect(formatNumber(value)).toBe('—')
  })
})

describe('formatKwh', () => {
  it('añade la unidad con un decimal', () => {
    expect(formatKwh(1234.5)).toBe('1.234,5 kWh')
  })

  it('muestra — para null', () => {
    expect(formatKwh(null)).toBe('—')
  })
})

describe('formatPercent', () => {
  it('convierte una fracción en porcentaje', () => {
    expect(formatPercent(0.87)).toBe('87 %')
  })

  it('admite decimales', () => {
    expect(formatPercent(0.875, 1)).toBe('87,5 %')
  })

  it('muestra — para null', () => {
    expect(formatPercent(null)).toBe('—')
  })
})

describe('formatDateTime', () => {
  it('muestra fecha y hora en la zona horaria del navegador', () => {
    const result = formatDateTime('2026-09-29T15:00:00.000Z')

    expect(result).toContain('2026')
    expect(result).toMatch(/10:00/)
  })

  it('muestra — para null o fechas inválidas', () => {
    expect(formatDateTime(null)).toBe('—')
    expect(formatDateTime('no-es-una-fecha')).toBe('—')
  })
})

describe('formatAxisDateTime', () => {
  it('muestra día, mes y hora en la zona horaria del navegador', () => {
    const result = formatAxisDateTime(new Date('2026-09-29T19:00:00.000Z').getTime())

    expect(result).toContain('29')
    expect(result).toMatch(/sep/i)
    expect(result).toMatch(/14:00|2:00/)
  })
})

describe('formatRelative', () => {
  const now = new Date('2026-09-29T12:00:00.000Z').getTime()

  it('expresa horas pasadas como "hace N h"', () => {
    expect(formatRelative('2026-09-29T09:00:00.000Z', now)).toBe('hace 3 h')
  })

  it('expresa días pasados', () => {
    expect(formatRelative('2026-09-26T12:00:00.000Z', now)).toMatch(/^hace 3 d/)
  })

  it('muestra — para null o fechas inválidas', () => {
    expect(formatRelative(null, now)).toBe('—')
    expect(formatRelative('no-es-una-fecha', now)).toBe('—')
  })
})
