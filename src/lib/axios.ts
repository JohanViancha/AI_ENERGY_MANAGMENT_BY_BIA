import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios'
import { signOut } from 'firebase/auth'

import { auth } from '@/lib/firebase'

interface RetriableRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean
}

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
})

// El token se pide en cada request: el SDK de Firebase renueva el vencido por su
// cuenta, así que no se guarda en ningún store ni en localStorage.
api.interceptors.request.use(async (config) => {
  const token = await auth.currentUser?.getIdToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  async (error: unknown) => {
    if (!(error instanceof AxiosError) || error.response?.status !== 401 || !error.config) {
      throw error
    }

    const originalRequest = error.config as RetriableRequestConfig

    if (originalRequest._retry) {
      // El reintento también recibió 401: se cierra sesión y ProtectedRoute redirige.
      await signOut(auth)
      throw error
    }

    const { currentUser } = auth
    if (!currentUser) {
      await signOut(auth)
      throw error
    }

    originalRequest._retry = true
    try {
      await currentUser.getIdToken(true)
    } catch {
      await signOut(auth)
      throw error
    }

    // El interceptor de request vuelve a adjuntar el token ya refrescado.
    return api(originalRequest)
  },
)
