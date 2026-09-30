import { useCallback, useEffect, useRef, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { isAxiosError } from 'axios'

import { getErrorMessage } from '@/lib/query-client'
import { getAnalysis, startAnalysis } from '@/services/ai.service'
import { subscribeToAnalysis } from '@/services/analysis-stream.service'
import type { Analysis } from '@/types/analysis'

export type AnalysisTransport = 'firestore' | 'polling'

export interface UseAnalysisRunResult {
  analysis: Analysis | null
  transport: AnalysisTransport | null
  isStarting: boolean
  isRunning: boolean
  startError: string | null
  start: () => void
}

export const ACTIVE_ANALYSIS_STORAGE_KEY = 'energy:active-analysis-id'
export const POLLING_INTERVAL_MS = 2000

// sessionStorage puede estar bloqueado (modo privado): el hook funciona igual sin persistencia.
function readStoredAnalysisId(): string | null {
  try {
    return sessionStorage.getItem(ACTIVE_ANALYSIS_STORAGE_KEY)
  } catch {
    return null
  }
}

function writeStoredAnalysisId(analysisId: string) {
  try {
    sessionStorage.setItem(ACTIVE_ANALYSIS_STORAGE_KEY, analysisId)
  } catch {
    // Sin persistencia: solo se pierde la reanudación tras recargar.
  }
}

function clearStoredAnalysisId() {
  try {
    sessionStorage.removeItem(ACTIVE_ANALYSIS_STORAGE_KEY)
  } catch {
    // Nada que limpiar si el almacenamiento no está disponible.
  }
}

/**
 * Lanza una corrida de análisis y sigue su progreso: `onSnapshot` de Firestore y, si la
 * suscripción falla, polling de `GET /ai/analysis/:id`. Es el único llamador de `POST /ai/analyze`.
 */
export function useAnalysisRun(): UseAnalysisRunResult {
  const queryClient = useQueryClient()
  const [activeAnalysisId, setActiveAnalysisId] = useState<string | null>(readStoredAnalysisId)
  const [analysis, setAnalysis] = useState<Analysis | null>(null)
  const [transport, setTransport] = useState<AnalysisTransport | null>(
    activeAnalysisId ? 'firestore' : null,
  )
  const [isStarting, setIsStarting] = useState(false)
  const [startError, setStartError] = useState<string | null>(null)
  const isStartingRef = useRef(false)

  useEffect(() => {
    if (!activeAnalysisId) return

    let cancelled = false
    let finished = false
    let unsubscribe: (() => void) | null = null
    let pollTimer: ReturnType<typeof setInterval> | null = null

    const finish = () => {
      finished = true
      clearStoredAnalysisId()
      setActiveAnalysisId(null)
    }

    const handleAnalysis = (next: Analysis) => {
      if (cancelled || finished) return
      setAnalysis(next)
      if (next.status === 'RUNNING') return
      finish()
      if (next.status === 'COMPLETED') {
        void queryClient.invalidateQueries({ queryKey: ['dashboard'] })
        void queryClient.invalidateQueries({ queryKey: ['meters'] })
        void queryClient.invalidateQueries({ queryKey: ['anomalies'] })
      }
    }

    const poll = async () => {
      try {
        handleAnalysis(await getAnalysis(activeAnalysisId))
      } catch (error) {
        // Un id obsoleto (documento inexistente) se descarta sin mostrar error.
        if (!cancelled && !finished && isAxiosError(error) && error.response?.status === 404) {
          finish()
        }
        // Otros fallos son transitorios: el siguiente tick reintenta.
      }
    }

    const startPolling = () => {
      if (cancelled || finished || pollTimer) return
      unsubscribe?.()
      unsubscribe = null
      setTransport('polling')
      void poll()
      pollTimer = setInterval(() => void poll(), POLLING_INTERVAL_MS)
    }

    unsubscribe = subscribeToAnalysis(activeAnalysisId, {
      onNext: handleAnalysis,
      onError: startPolling,
    })

    return () => {
      cancelled = true
      unsubscribe?.()
      if (pollTimer) clearInterval(pollTimer)
    }
  }, [activeAnalysisId, queryClient])

  const start = useCallback(() => {
    // El ref cubre el doble clic antes de que React pinte el estado deshabilitado.
    if (isStartingRef.current || activeAnalysisId) return
    isStartingRef.current = true
    setIsStarting(true)
    setStartError(null)
    startAnalysis()
      .then(({ analysisId }) => {
        writeStoredAnalysisId(analysisId)
        setAnalysis(null)
        setTransport('firestore')
        setActiveAnalysisId(analysisId)
      })
      .catch((error: unknown) => setStartError(getErrorMessage(error)))
      .finally(() => {
        isStartingRef.current = false
        setIsStarting(false)
      })
  }, [activeAnalysisId])

  return {
    analysis,
    transport,
    isStarting,
    // También cuenta la corrida reanudada que aún no recibió su primer snapshot.
    isRunning: isStarting || activeAnalysisId !== null || analysis?.status === 'RUNNING',
    startError,
    start,
  }
}
