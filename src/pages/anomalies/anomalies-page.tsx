import { AlertTriangle } from 'lucide-react'

import { EmptyState } from '@/components/shared/empty-state'

/** Pantalla protegida `/anomalies`; placeholder hasta el SPEC 04. */
export function AnomaliesPage() {
  return (
    <EmptyState
      icon={AlertTriangle}
      title="Anomalías"
      description="Aquí se mostrarán las anomalías detectadas por IA."
    />
  )
}
