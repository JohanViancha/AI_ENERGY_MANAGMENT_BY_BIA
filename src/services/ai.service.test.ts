import { beforeEach, describe, expect, it, vi } from 'vitest'

import { api } from '@/lib/axios'
import { getAnalysis, startAnalysis } from '@/services/ai.service'

vi.mock('@/lib/axios', () => ({ api: { get: vi.fn(), post: vi.fn() } }))

const get = vi.mocked(api.get)
const post = vi.mocked(api.post)

describe('ai.service', () => {
  beforeEach(() => {
    get.mockReset()
    post.mockReset()
  })

  it('startAnalysis hace POST /ai/analyze con cuerpo vacío', async () => {
    const payload = { analysisId: 'an-1', status: 'RUNNING' }
    post.mockResolvedValue({ data: payload })

    const result = await startAnalysis()

    expect(post).toHaveBeenCalledWith('/ai/analyze', {})
    expect(result).toBe(payload)
  })

  it('getAnalysis hace GET /ai/analysis/:id', async () => {
    const analysis = { id: 'an-1' }
    get.mockResolvedValue({ data: analysis })

    const result = await getAnalysis('an-1')

    expect(get).toHaveBeenCalledWith('/ai/analysis/an-1')
    expect(result).toBe(analysis)
  })
})
