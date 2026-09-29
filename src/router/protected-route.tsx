import { Loader2 } from 'lucide-react'
import { Navigate, Outlet, useLocation } from 'react-router-dom'

import { useAuth } from '@/hooks/use-auth'

/** Restringe las rutas hijas a usuarios con sesión; guarda la ruta de origen en `state.from`. */
export function ProtectedRoute() {
  const { user, isLoading } = useAuth()
  const location = useLocation()

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 role="status" aria-label="Cargando" className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (user === null) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  return <Outlet />
}
