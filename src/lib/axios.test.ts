import {
  AxiosError,
  type AxiosAdapter,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from 'axios'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { api } from '@/lib/axios'

const mocks = vi.hoisted(() => ({
  signOut: vi.fn(),
  getIdToken: vi.fn(),
  auth: { currentUser: null as { getIdToken: (force?: boolean) => Promise<string> } | null },
}))

vi.mock('firebase/auth', () => ({ signOut: mocks.signOut }))
vi.mock('@/lib/firebase', () => ({ auth: mocks.auth }))

function respond(config: InternalAxiosRequestConfig, status: number): Promise<AxiosResponse> {
  const response = { data: {}, status, statusText: '', headers: {}, config } as AxiosResponse
  if (status >= 400) {
    return Promise.reject(new AxiosError('fail', String(status), config, null, response))
  }
  return Promise.resolve(response)
}

function useAdapter(statuses: number[]) {
  const calls: InternalAxiosRequestConfig[] = []
  const adapter: AxiosAdapter = (config) => {
    calls.push(config)
    return respond(config, statuses[calls.length - 1] ?? statuses[statuses.length - 1])
  }
  api.defaults.adapter = adapter
  return calls
}

describe('axios instance', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.getIdToken.mockImplementation(async (force?: boolean) =>
      force ? 'token-refrescado' : 'token-inicial',
    )
    mocks.auth.currentUser = { getIdToken: mocks.getIdToken }
    mocks.signOut.mockResolvedValue(undefined)
  })

  it('sends the Authorization Bearer header with the current idToken', async () => {
    const calls = useAdapter([200])

    await api.get('/meters')

    expect(calls[0].headers.Authorization).toBe('Bearer token-inicial')
  })

  it('sends no Authorization header when there is no user', async () => {
    mocks.auth.currentUser = null
    const calls = useAdapter([200])

    await api.get('/meters')

    expect(calls[0].headers.Authorization).toBeUndefined()
  })

  it('refreshes the token on 401 and retries exactly once', async () => {
    const calls = useAdapter([401, 200])

    const response = await api.get('/meters')

    expect(response.status).toBe(200)
    expect(mocks.getIdToken).toHaveBeenCalledWith(true)
    expect(calls).toHaveLength(2)
    expect(mocks.signOut).not.toHaveBeenCalled()
  })

  it('signs out and does not retry again when the retry also returns 401', async () => {
    const calls = useAdapter([401, 401])

    await expect(api.get('/meters')).rejects.toMatchObject({ response: { status: 401 } })

    expect(calls).toHaveLength(2)
    expect(mocks.signOut).toHaveBeenCalledTimes(1)
  })

  it('signs out without retrying when a 401 arrives and there is no user', async () => {
    mocks.auth.currentUser = null
    const calls = useAdapter([401])

    await expect(api.get('/meters')).rejects.toMatchObject({ response: { status: 401 } })

    expect(calls).toHaveLength(1)
    expect(mocks.signOut).toHaveBeenCalledTimes(1)
  })

  it('signs out when refreshing the token fails', async () => {
    mocks.getIdToken.mockImplementation(async (force?: boolean) => {
      if (force) throw new Error('refresh failed')
      return 'token-inicial'
    })
    const calls = useAdapter([401])

    await expect(api.get('/meters')).rejects.toMatchObject({ response: { status: 401 } })

    expect(calls).toHaveLength(1)
    expect(mocks.signOut).toHaveBeenCalledTimes(1)
  })

  it('does not retry or sign out on non-401 errors', async () => {
    const calls = useAdapter([500])

    await expect(api.get('/meters')).rejects.toMatchObject({ response: { status: 500 } })

    expect(calls).toHaveLength(1)
    expect(mocks.signOut).not.toHaveBeenCalled()
  })
})
