import { AlertTriangle } from 'lucide-react'

import { Button } from '@/components/ui/button'

export interface ErrorStateProps {
  title?: string
  message?: string
  onRetry: () => void
}

/** Bloque de error de un bloque de datos; ofrece "Reintentar" sin depender del toast. */
export function ErrorState({
  title = 'No se pudieron cargar los datos',
  message = 'Revisa tu conexión e inténtalo de nuevo.',
  onRetry,
}: ErrorStateProps) {
  return (
    <div
      role="alert"
      className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-destructive/50 p-8 text-center"
    >
      <AlertTriangle className="h-8 w-8 text-destructive" aria-hidden="true" />
      <h2 className="text-base font-semibold">{title}</h2>
      <p className="max-w-sm text-sm text-muted-foreground">{message}</p>
      <Button variant="outline" onClick={onRetry}>
        Reintentar
      </Button>
    </div>
  )
}
