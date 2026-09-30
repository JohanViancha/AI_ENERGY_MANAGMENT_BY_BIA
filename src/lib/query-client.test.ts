import { AxiosError, type InternalAxiosRequestConfig } from 'axios'
import { toast } from 'sonner'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { createQueryClient } from '@/lib/query-client'

vi.mock('sonner', () => ({ toast: { error: vi.fn() } }))

function httpError(status: number, data: unknown = {}) {
  const config = {} as InternalAxiosRequestConfig
  return new AxiosError('fail', String(status), config, null, {
    data,
    status,
    statusText: '',
    headers: {},
    config,
  })
}

async function runFailingQuery(error: unknown, cachedData?: unknown) {
  const client = createQueryClient()
  const queryKey = ['test']
  if (cachedData !== undefined) client.setQueryData(queryKey, cachedData)

  await client
    .fetchQuery({
      queryKey,
      queryFn: () => Promise.reject(error),
      retry: false,
      staleTime: 0,
    })
    .catch(() => undefined)
}

describe('QueryCache.onError global', () => {
  beforeEach(() => {
    vi.mocked(toast.error).mockClear()
  })

  it('muestra el message del backend en un toast', async () => {
    await runFailingQuery(httpError(500, { statusCode: 500, message: 'Firestore caído' }))

    expect(toast.error).toHaveBeenCalledWith('Firestore caído')
  })

  it('une los mensajes cuando el backend devuelve una lista', async () => {
    await runFailingQuery(httpError(400, { message: ['from inválido', 'to inválido'] }))

    expect(toast.error).toHaveBeenCalledWith('from inválido. to inválido')
  })

  it('usa un texto genérico cuando no hay respuesta del backend', async () => {
    await runFailingQuery(new Error('Network Error'))

    expect(toast.error).toHaveBeenCalledWith(
      'No se pudo completar la solicitud. Inténtalo de nuevo.',
    )
  })

  it('no muestra toast ante un 401', async () => {
    await runFailingQuery(httpError(401))

    expect(toast.error).not.toHaveBeenCalled()
  })

  it('no muestra toast ante un 404', async () => {
    await runFailingQuery(httpError(404))

    expect(toast.error).not.toHaveBeenCalled()
  })

  it('no muestra toast si la query ya tenía datos en caché', async () => {
    await runFailingQuery(httpError(500), { cached: true })

    expect(toast.error).not.toHaveBeenCalled()
  })
})

describe('defaults de QueryClient', () => {
  it('fija staleTime en 60 s', () => {
    expect(createQueryClient().getDefaultOptions().queries?.staleTime).toBe(60_000)
  })

  it('reintenta una vez los errores de red y 5xx', () => {
    const retry = createQueryClient().getDefaultOptions().queries?.retry as (
      failureCount: number,
      error: unknown,
    ) => boolean

    expect(retry(0, httpError(500))).toBe(true)
    expect(retry(0, new Error('Network Error'))).toBe(true)
    expect(retry(1, httpError(500))).toBe(false)
  })

  it('no reintenta los 4xx', () => {
    const retry = createQueryClient().getDefaultOptions().queries?.retry as (
      failureCount: number,
      error: unknown,
    ) => boolean

    expect(retry(0, httpError(404))).toBe(false)
    expect(retry(0, httpError(400))).toBe(false)
  })
})
