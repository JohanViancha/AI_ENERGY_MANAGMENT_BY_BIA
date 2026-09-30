import { beforeEach, describe, expect, it, vi } from 'vitest'

import { api } from '@/lib/axios'
import { getMeter, getMeterReadings, getMeters } from '@/services/meters.service'

vi.mock('@/lib/axios', () => ({ api: { get: vi.fn() } }))

const get = vi.mocked(api.get)

describe('meters.service', () => {
  beforeEach(() => {
    get.mockReset()
  })

  it('getMeters pide /meters y devuelve response.data', async () => {
    const meters = [{ meterId: 'M-101' }]
    get.mockResolvedValue({ data: meters })

    const result = await getMeters()

    expect(get).toHaveBeenCalledWith('/meters')
    expect(result).toBe(meters)
  })

  it('getMeter pide /meters/:meterId y devuelve response.data', async () => {
    const detail = { meterId: 'M-109' }
    get.mockResolvedValue({ data: detail })

    const result = await getMeter('M-109')

    expect(get).toHaveBeenCalledWith('/meters/M-109')
    expect(result).toBe(detail)
  })

  it('getMeter codifica el meterId en la ruta', async () => {
    get.mockResolvedValue({ data: {} })

    await getMeter('M 1/2')

    expect(get).toHaveBeenCalledWith('/meters/M%201%2F2')
  })

  it('getMeterReadings envía from, to y limit=500 por defecto', async () => {
    const page = { data: [], nextCursor: null }
    get.mockResolvedValue({ data: page })

    const result = await getMeterReadings('M-109', {
      from: '2026-09-22T00:00:00.000Z',
      to: '2026-09-29T00:00:00.000Z',
    })

    expect(get).toHaveBeenCalledWith('/meters/M-109/readings', {
      params: { from: '2026-09-22T00:00:00.000Z', to: '2026-09-29T00:00:00.000Z', limit: 500 },
    })
    expect(result).toBe(page)
  })

  it('getMeterReadings respeta un limit explícito', async () => {
    get.mockResolvedValue({ data: { data: [], nextCursor: null } })

    await getMeterReadings('M-109', { from: 'a', to: 'b', limit: 24 })

    expect(get).toHaveBeenCalledWith('/meters/M-109/readings', {
      params: { from: 'a', to: 'b', limit: 24 },
    })
  })

  it('propaga el error del cliente HTTP', async () => {
    get.mockRejectedValue(new Error('404'))

    await expect(getMeter('M-999')).rejects.toThrow('404')
  })
})
