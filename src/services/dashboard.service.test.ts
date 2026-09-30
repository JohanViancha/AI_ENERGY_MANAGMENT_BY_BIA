import { beforeEach, describe, expect, it, vi } from 'vitest'

import { api } from '@/lib/axios'
import { getDashboardSummary } from '@/services/dashboard.service'

vi.mock('@/lib/axios', () => ({ api: { get: vi.fn() } }))

const get = vi.mocked(api.get)

describe('dashboard.service', () => {
  beforeEach(() => {
    get.mockReset()
  })

  it('getDashboardSummary pide /dashboard/summary y devuelve response.data', async () => {
    const summary = { analysisId: null }
    get.mockResolvedValue({ data: summary })

    const result = await getDashboardSummary()

    expect(get).toHaveBeenCalledWith('/dashboard/summary')
    expect(result).toBe(summary)
  })
})
