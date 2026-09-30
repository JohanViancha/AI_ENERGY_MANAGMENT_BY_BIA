import type { ReactNode } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, renderHook, waitFor } from '@testing-library/react'
import { AxiosError } from 'axios'
import { afterEach, beforeEach, describe, expect, it, vi, type Mock } from 'vitest'

import {
  ACTIVE_ANALYSIS_STORAGE_KEY,
  POLLING_INTERVAL_MS,
  useAnalysisRun,
} from '@/hooks/use-analysis'
import { getAnalysis, startAnalysis } from '@/services/ai.service'
import { subscribeToAnalysis } from '@/services/analysis-stream.service'
import type { Analysis } from '@/types/analysis'

vi.mock('@/services/ai.service', () => ({ startAnalysis: vi.fn(), getAnalysis: vi.fn() }))
vi.mock('@/services/analysis-stream.service', () => ({ subscribeToAnalysis: vi.fn() }))

const startAnalysisMock = vi.mocked(startAnalysis)
const getAnalysisMock = vi.mocked(getAnalysis)
const subscribeMock = vi.mocked(subscribeToAnalysis)

function buildAnalysis(overrides: Partial<Analysis> = {}): Analysis {
  return {
    id: 'an-1',
    startedAt: '2026-09-29T10:00:00Z',
    finishedAt: null,
    status: 'RUNNING',
    errorCode: null,
    errorMessage: null,
    triggeredBy: 'MANUAL',
    metersAnalyzed: ['M-101'],
    progress: { phase: 'DETECTION', pct: 40 },
    anomaliesCount: 0,
    highPriorityCount: 0,
    ...overrides,
  }
}

function buildHttpError(status: number, data?: unknown) {
  return new AxiosError('error', String(status), undefined, undefined, {
    status,
    data,
  } as never)
}

type Handlers = Parameters<typeof subscribeToAnalysis>[1]

let queryClient: QueryClient
let unsubscribeMock: Mock<() => void>
let handlers: Handlers

function renderRun() {
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
  return renderHook(() => useAnalysisRun(), { wrapper })
}

beforeEach(() => {
  sessionStorage.clear()
  queryClient = new QueryClient()
  unsubscribeMock = vi.fn<() => void>()
  subscribeMock.mockImplementation((_id, subscriptionHandlers) => {
    handlers = subscriptionHandlers
    return unsubscribeMock
  })
  startAnalysisMock.mockResolvedValue({ analysisId: 'an-1', status: 'RUNNING' })
})

afterEach(() => {
  vi.useRealTimers()
  vi.clearAllMocks()
})

describe('useAnalysisRun', () => {
  it('starts a run, stores the id and subscribes to Firestore', async () => {
    const { result } = renderRun()

    act(() => result.current.start())
    await waitFor(() => expect(subscribeMock).toHaveBeenCalledWith('an-1', expect.anything()))
    act(() => handlers.onNext(buildAnalysis()))

    expect(startAnalysisMock).toHaveBeenCalledTimes(1)
    expect(sessionStorage.getItem(ACTIVE_ANALYSIS_STORAGE_KEY)).toBe('an-1')
    expect(result.current.transport).toBe('firestore')
    expect(result.current.isRunning).toBe(true)
    expect(result.current.analysis?.progress.pct).toBe(40)
  })

  it('does not launch a second run while one is in progress', async () => {
    const { result } = renderRun()

    act(() => {
      result.current.start()
      result.current.start()
    })
    await waitFor(() => expect(subscribeMock).toHaveBeenCalled())
    act(() => result.current.start())

    expect(startAnalysisMock).toHaveBeenCalledTimes(1)
  })

  it('invalidates dashboard, meters and anomalies when the run completes', async () => {
    const invalidate = vi.spyOn(queryClient, 'invalidateQueries')
    const { result } = renderRun()

    act(() => result.current.start())
    await waitFor(() => expect(subscribeMock).toHaveBeenCalled())
    act(() => handlers.onNext(buildAnalysis({ status: 'COMPLETED', finishedAt: 'x' })))

    expect(invalidate).toHaveBeenCalledWith({ queryKey: ['dashboard'] })
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ['meters'] })
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ['anomalies'] })
    expect(sessionStorage.getItem(ACTIVE_ANALYSIS_STORAGE_KEY)).toBeNull()
    expect(unsubscribeMock).toHaveBeenCalled()
    expect(result.current.isRunning).toBe(false)
  })

  it('exposes errorMessage, clears the key and allows retry when the run fails', async () => {
    const invalidate = vi.spyOn(queryClient, 'invalidateQueries')
    const { result } = renderRun()

    act(() => result.current.start())
    await waitFor(() => expect(subscribeMock).toHaveBeenCalled())
    act(() =>
      handlers.onNext(buildAnalysis({ status: 'FAILED', errorMessage: 'Fallo de detección' })),
    )

    expect(result.current.analysis?.errorMessage).toBe('Fallo de detección')
    expect(result.current.isRunning).toBe(false)
    expect(sessionStorage.getItem(ACTIVE_ANALYSIS_STORAGE_KEY)).toBeNull()
    expect(invalidate).not.toHaveBeenCalled()
  })

  it('falls back to polling every 2 seconds when the subscription fails', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    getAnalysisMock.mockResolvedValue(buildAnalysis({ progress: { phase: 'BASELINE', pct: 20 } }))
    const { result } = renderRun()

    act(() => result.current.start())
    await vi.waitFor(() => expect(subscribeMock).toHaveBeenCalled())
    act(() => handlers.onError(new Error('permission-denied')))

    await vi.waitFor(() => expect(result.current.transport).toBe('polling'))
    await vi.waitFor(() => expect(getAnalysisMock).toHaveBeenCalledTimes(1))
    await act(() => vi.advanceTimersByTimeAsync(POLLING_INTERVAL_MS))

    expect(getAnalysisMock).toHaveBeenCalledTimes(2)
    expect(getAnalysisMock).toHaveBeenCalledWith('an-1')
    expect(result.current.analysis?.progress.pct).toBe(20)
    expect(unsubscribeMock).toHaveBeenCalled()
  })

  it('stops polling once the run completes', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    getAnalysisMock.mockResolvedValue(buildAnalysis({ status: 'COMPLETED' }))
    const { result } = renderRun()

    act(() => result.current.start())
    await vi.waitFor(() => expect(subscribeMock).toHaveBeenCalled())
    act(() => handlers.onError(new Error('permission-denied')))
    await vi.waitFor(() => expect(result.current.isRunning).toBe(false))
    await act(() => vi.advanceTimersByTimeAsync(POLLING_INTERVAL_MS * 3))

    expect(getAnalysisMock).toHaveBeenCalledTimes(1)
  })

  it('resumes the stored analysis id on mount', () => {
    sessionStorage.setItem(ACTIVE_ANALYSIS_STORAGE_KEY, 'an-9')

    const { result } = renderRun()

    expect(subscribeMock).toHaveBeenCalledWith('an-9', expect.anything())
    expect(startAnalysisMock).not.toHaveBeenCalled()
    expect(result.current.isRunning).toBe(true)
  })

  it('discards a stored id whose document no longer exists', async () => {
    sessionStorage.setItem(ACTIVE_ANALYSIS_STORAGE_KEY, 'an-old')
    getAnalysisMock.mockRejectedValue(buildHttpError(404))
    const { result } = renderRun()

    act(() => handlers.onError(new Error('no existe')))

    await waitFor(() => expect(result.current.isRunning).toBe(false))
    expect(sessionStorage.getItem(ACTIVE_ANALYSIS_STORAGE_KEY)).toBeNull()
    expect(result.current.startError).toBeNull()
  })

  it('exposes the backend message when the POST fails', async () => {
    startAnalysisMock.mockRejectedValue(buildHttpError(400, { message: 'Parámetros inválidos' }))
    const { result } = renderRun()

    act(() => result.current.start())

    await waitFor(() => expect(result.current.startError).toBe('Parámetros inválidos'))
    expect(result.current.isRunning).toBe(false)
    expect(subscribeMock).not.toHaveBeenCalled()
    expect(sessionStorage.getItem(ACTIVE_ANALYSIS_STORAGE_KEY)).toBeNull()
  })

  it('keeps a single subscription across re-renders and unsubscribes on unmount', async () => {
    const { result, rerender, unmount } = renderRun()

    act(() => result.current.start())
    await waitFor(() => expect(subscribeMock).toHaveBeenCalledTimes(1))
    rerender()
    rerender()
    unmount()

    expect(subscribeMock).toHaveBeenCalledTimes(1)
    expect(unsubscribeMock).toHaveBeenCalledTimes(1)
  })
})
