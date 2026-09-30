import { isAxiosError } from 'axios'
import { SearchX } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'

import { EvidencePanel } from '@/components/ai/evidence-panel'
import { AnomalyTypeBadge } from '@/components/anomalies/anomaly-type-badge'
import { ConfidenceIndicator } from '@/components/anomalies/confidence-indicator'
import { SeverityBadge } from '@/components/anomalies/severity-badge'
import { EmptyState } from '@/components/shared/empty-state'
import { ErrorState } from '@/components/shared/error-state'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useAnomaly } from '@/hooks/use-anomaly'
import { formatDateTime, formatNumber } from '@/lib/format'
import type { AnomalyStatus } from '@/types/anomaly'

const NO_INFORMATION = 'Sin información disponible'

const STATUS_LABELS: Record<AnomalyStatus, string> = {
  OPEN: 'Abierta',
  REVIEWED: 'Revisada',
  RESOLVED: 'Resuelta',
}

/** Pantalla protegida `/anomalies/:id`: expediente de una anomalía con evidencia y acción. */
export function AnomalyDetailPage() {
  const { id } = useParams<{ id: string }>()
  const anomaly = useAnomaly(id)

  if (anomaly.isError && !anomaly.data) {
    if (isAxiosError(anomaly.error) && anomaly.error.response?.status === 404) {
      return (
        <EmptyState
          icon={SearchX}
          title="Anomalía no encontrada"
          description={`No existe una anomalía con el identificador ${id}.`}
          action={
            <Button asChild variant="outline">
              <Link to="/anomalies">Volver a anomalías</Link>
            </Button>
          }
        />
      )
    }
    return (
      <ErrorState title="No se pudo cargar la anomalía" onRetry={() => void anomaly.refetch()} />
    )
  }

  if (!anomaly.data) {
    return (
      <div aria-busy="true" className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    )
  }

  const data = anomaly.data

  return (
    <div className="space-y-6">
      <header className="space-y-3">
        <h1 className="text-2xl font-semibold">
          Anomalía en{' '}
          <Link
            to={`/meters/${encodeURIComponent(data.meterId)}`}
            className="underline-offset-4 hover:underline"
          >
            {data.meterId}
          </Link>
        </h1>
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
          <SeverityBadge severity={data.severity} />
          <AnomalyTypeBadge type={data.type} />
          <span>
            <span className="text-muted-foreground">Prioridad: </span>
            <span className="font-medium tabular-nums">{formatNumber(data.priorityScore, 1)}</span>
          </span>
          <span className="flex items-center gap-2">
            <span className="text-muted-foreground">Confianza:</span>
            <ConfidenceIndicator confidence={data.confidence} />
          </span>
          <span>
            <span className="text-muted-foreground">Estado: </span>
            {STATUS_LABELS[data.status]}
          </span>
          <span>
            <span className="text-muted-foreground">Detectada: </span>
            {formatDateTime(data.detectedAt)}
          </span>
        </div>
      </header>

      <section aria-label="Qué encontró la IA" className="space-y-2">
        <h2 className="text-lg font-semibold">Qué encontró la IA</h2>
        <p className="text-sm">{data.reason ?? NO_INFORMATION}</p>
      </section>

      <section aria-label="Evidencia" className="space-y-3">
        <h2 className="text-lg font-semibold">Evidencia</h2>
        <EvidencePanel evidence={data.evidence} />
      </section>

      <section aria-label="Acción recomendada" className="space-y-2">
        <h2 className="text-lg font-semibold">Acción recomendada</h2>
        <p className="text-sm">{data.recommendedAction ?? NO_INFORMATION}</p>
      </section>
    </div>
  )
}
