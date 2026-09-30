import { doc, onSnapshot } from 'firebase/firestore'

import { db } from '@/lib/firebase'
import type { Analysis, AnalysisFirestoreDoc } from '@/types/analysis'

export interface AnalysisSubscriptionHandlers {
  onNext: (analysis: Analysis) => void
  onError: (error: Error) => void
}

/** Único punto que conoce el formato de Firestore: convierte snake_case a camelCase. */
export function mapAnalysisDoc(id: string, data: AnalysisFirestoreDoc): Analysis {
  return {
    id,
    startedAt: data.started_at,
    finishedAt: data.finished_at,
    status: data.status,
    errorCode: data.error_code,
    errorMessage: data.error_message,
    triggeredBy: data.triggered_by,
    metersAnalyzed: data.meters_analyzed,
    progress: { phase: data.progress.phase, pct: data.progress.pct },
    anomaliesCount: data.anomalies_count,
    highPriorityCount: data.high_priority_count,
  }
}

/**
 * Se suscribe en vivo a `analyses/{analysisId}`.
 * Llama a `onError` si el documento no existe o la suscripción falla (p. ej. permission-denied).
 * @returns función para cancelar la suscripción.
 */
export function subscribeToAnalysis(
  analysisId: string,
  { onNext, onError }: AnalysisSubscriptionHandlers,
): () => void {
  return onSnapshot(
    doc(db, 'analyses', analysisId),
    (snapshot) => {
      if (!snapshot.exists()) {
        onError(new Error(`El análisis ${analysisId} no existe`))
        return
      }
      onNext(mapAnalysisDoc(snapshot.id, snapshot.data() as AnalysisFirestoreDoc))
    },
    (error) => onError(error),
  )
}
