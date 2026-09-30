import { doc, onSnapshot } from 'firebase/firestore'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { mapAnalysisDoc, subscribeToAnalysis } from '@/services/analysis-stream.service'
import type { AnalysisFirestoreDoc } from '@/types/analysis'

vi.mock('@/lib/firebase', () => ({ db: { name: 'db' } }))
vi.mock('firebase/firestore', () => ({ doc: vi.fn(), onSnapshot: vi.fn() }))

const docMock = vi.mocked(doc)
const onSnapshotMock = vi.mocked(onSnapshot)

const firestoreDoc: AnalysisFirestoreDoc = {
  started_at: '2026-09-29T10:00:00Z',
  finished_at: null,
  status: 'RUNNING',
  error_code: null,
  error_message: null,
  triggered_by: 'MANUAL',
  meters_analyzed: ['M-101', 'M-109'],
  progress: { phase: 'DETECTION', pct: 40 },
  anomalies_count: 3,
  high_priority_count: 1,
}

const expectedAnalysis = {
  id: 'an-1',
  startedAt: '2026-09-29T10:00:00Z',
  finishedAt: null,
  status: 'RUNNING',
  errorCode: null,
  errorMessage: null,
  triggeredBy: 'MANUAL',
  metersAnalyzed: ['M-101', 'M-109'],
  progress: { phase: 'DETECTION', pct: 40 },
  anomaliesCount: 3,
  highPriorityCount: 1,
}

describe('mapAnalysisDoc', () => {
  it('convierte snake_case a camelCase e incorpora el id', () => {
    expect(mapAnalysisDoc('an-1', firestoreDoc)).toEqual(expectedAnalysis)
  })
})

describe('subscribeToAnalysis', () => {
  const onNext = vi.fn()
  const onError = vi.fn()

  beforeEach(() => {
    onNext.mockReset()
    onError.mockReset()
    docMock.mockReset()
    onSnapshotMock.mockReset()
    docMock.mockReturnValue('docRef' as never)
  })

  it('escucha analyses/{id} y emite el Analysis mapeado', () => {
    onSnapshotMock.mockImplementation(((_ref: unknown, next: (s: unknown) => void) => {
      next({ exists: () => true, id: 'an-1', data: () => firestoreDoc })
      return vi.fn()
    }) as never)

    subscribeToAnalysis('an-1', { onNext, onError })

    expect(docMock).toHaveBeenCalledWith({ name: 'db' }, 'analyses', 'an-1')
    expect(onNext).toHaveBeenCalledWith(expectedAnalysis)
    expect(onError).not.toHaveBeenCalled()
  })

  it('llama a onError si el documento no existe', () => {
    onSnapshotMock.mockImplementation(((_ref: unknown, next: (s: unknown) => void) => {
      next({ exists: () => false })
      return vi.fn()
    }) as never)

    subscribeToAnalysis('an-1', { onNext, onError })

    expect(onError).toHaveBeenCalledWith(expect.any(Error))
    expect(onNext).not.toHaveBeenCalled()
  })

  it('llama a onError si onSnapshot falla', () => {
    const failure = new Error('permission-denied')
    onSnapshotMock.mockImplementation(((
      _ref: unknown,
      _next: unknown,
      fail: (e: Error) => void,
    ) => {
      fail(failure)
      return vi.fn()
    }) as never)

    subscribeToAnalysis('an-1', { onNext, onError })

    expect(onError).toHaveBeenCalledWith(failure)
  })

  it('devuelve la función unsubscribe de onSnapshot', () => {
    const unsubscribe = vi.fn()
    onSnapshotMock.mockReturnValue(unsubscribe)

    const result = subscribeToAnalysis('an-1', { onNext, onError })

    expect(result).toBe(unsubscribe)
  })
})
