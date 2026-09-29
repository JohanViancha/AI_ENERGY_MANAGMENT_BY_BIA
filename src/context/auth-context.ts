import { createContext } from 'react'
import type { User } from 'firebase/auth'

export interface AuthContextValue {
  user: User | null
  /** true hasta que onAuthStateChanged dispara por primera vez. */
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
}

export const AuthContext = createContext<AuthContextValue | null>(null)
