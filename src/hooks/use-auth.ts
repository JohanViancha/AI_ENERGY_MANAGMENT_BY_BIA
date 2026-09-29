import { useContext } from 'react'

import { AuthContext, type AuthContextValue } from '@/context/auth-context'

/** Devuelve el estado de auth; debe usarse dentro de `AuthProvider`. */
export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)
  if (context === null) {
    throw new Error('useAuth debe usarse dentro de un AuthProvider')
  }
  return context
}
