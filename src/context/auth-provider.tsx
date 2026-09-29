import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { onAuthStateChanged, signInWithEmailAndPassword, signOut, type User } from 'firebase/auth'

import { AuthContext, type AuthContextValue } from '@/context/auth-context'
import { auth } from '@/lib/firebase'
import { queryClient } from '@/lib/query-client'

interface AuthProviderProps {
  children: ReactNode
}

/** Única fuente del estado de autenticación; se sincroniza con Firebase Auth. */
export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    return onAuthStateChanged(auth, (nextUser) => {
      // Evita que el siguiente usuario vea datos en caché del anterior,
      // tanto en logout manual como en el forzado por un 401.
      if (nextUser === null) {
        queryClient.clear()
      }
      setUser(nextUser)
      setIsLoading(false)
    })
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isLoading,
      login: async (email, password) => {
        await signInWithEmailAndPassword(auth, email, password)
      },
      logout: () => signOut(auth),
    }),
    [user, isLoading],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
