import { beforeEach, describe, expect, it, vi } from 'vitest'

import { api } from '@/lib/axios'
import { getAnomalies } from '@/services/anomalies.service'

vi.mock('@/lib/axios', () => ({ api: { get: vi.fn() } }))

const get = vi.mocked(api.get)

describe('anomalies.service', () => {
  beforeEach(() => {
    get.mockReset()
  })

  it('getAnomalies envía analysisId y meterId como query params', async () => {
    const anomalies = [{ id: 'a1' }]
    get.mockResolvedValue({ data: anomalies })

    const result = await getAnomalies({ analysisId: 'an-1', meterId: 'M-109' })

    expect(get).toHaveBeenCalledWith('/anomalies', {
      params: { analysisId: 'an-1', meterId: 'M-109' },
    })
    expect(result).toBe(anomalies)
  })
})
