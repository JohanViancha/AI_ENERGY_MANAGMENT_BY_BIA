import { QueryCache, QueryClient, type Query } from '@tanstack/react-query'
import { isAxiosError } from 'axios'
import { toast } from 'sonner'

import type { ApiErrorResponse } from '@/types/api-error'

const GENERIC_ERROR_MESSAGE = 'No se pudo completar la solicitud. Inténtalo de nuevo.'

function getStatus(error: unknown): number | undefined {
  return isAxiosError(error) ? error.response?.status : undefined
}

export function getErrorMessage(error: unknown): string {
  if (isAxiosError<Partial<ApiErrorResponse>>(error)) {
    const message = error.response?.data?.message
    if (Array.isArray(message) && message.length > 0) return message.join('. ')
    if (typeof message === 'string' && message.length > 0) return message
  }
  return GENERIC_ERROR_MESSAGE
}

/**
 * Avisa con un toast de las queries que fallan sin datos en caché. Se omite el 401 (el
 * interceptor de Axios ya cierra sesión), el 404 (cada pantalla lo resuelve con un
 * EmptyState) y los refetch en segundo plano, para no avisar de algo que el usuario ya ve.
 */
export function handleQueryError(error: unknown, query: Query<unknown, unknown, unknown>) {
  const status = getStatus(error)
  if (status === 401 || status === 404) return
  if (query.state.data !== undefined) return
  toast.error(getErrorMessage(error))
}

/** Reintenta una vez los fallos de red o 5xx; los 4xx no cambian al repetir la petición. */
function shouldRetry(failureCount: number, error: unknown): boolean {
  const status = getStatus(error)
  if (status !== undefined && status >= 400 && status < 500) return false
  return failureCount < 1
}

export function createQueryClient() {
  return new QueryClient({
    queryCache: new QueryCache({ onError: handleQueryError }),
    defaultOptions: {
      queries: {
        staleTime: 60_000,
        retry: shouldRetry,
      },
    },
  })
}

export const queryClient = createQueryClient()
