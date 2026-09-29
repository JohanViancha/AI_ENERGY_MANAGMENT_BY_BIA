import { useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { FirebaseError } from 'firebase/app'
import { Loader2 } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { Navigate, useLocation, type Location } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/hooks/use-auth'
import { loginSchema, type LoginFormValues } from '@/pages/login/login-schema'

const FIREBASE_ERROR_MESSAGES: Record<string, string> = {
  'auth/invalid-credential': 'Correo o contraseña incorrectos',
  'auth/too-many-requests': 'Demasiados intentos. Inténtalo más tarde',
  'auth/network-request-failed': 'Sin conexión. Revisa tu red',
}

const DEFAULT_LOGIN_ERROR = 'No se pudo iniciar sesión'

function getLoginErrorMessage(error: unknown): string {
  if (error instanceof FirebaseError) {
    return FIREBASE_ERROR_MESSAGES[error.code] ?? DEFAULT_LOGIN_ERROR
  }
  return DEFAULT_LOGIN_ERROR
}

/** Pantalla de inicio de sesión con Email/Password. */
export function LoginPage() {
  const { user, isLoading, login } = useAuth()
  const location = useLocation()
  const [submitError, setSubmitError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({ resolver: zodResolver(loginSchema) })

  // Evita mostrar el formulario a un usuario con sesión antes de que Firebase responda.
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 role="status" aria-label="Cargando" className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (user !== null) {
    const from = (location.state as { from?: Location } | null)?.from
    const destination = from ? `${from.pathname}${from.search}${from.hash}` : '/'
    return <Navigate to={destination} replace />
  }

  const onSubmit = async ({ email, password }: LoginFormValues) => {
    setSubmitError(null)
    try {
      await login(email, password)
    } catch (error) {
      setSubmitError(getLoginErrorMessage(error))
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Iniciar sesión</CardTitle>
          <CardDescription>Ingresa con tu correo y contraseña</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Correo</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                aria-invalid={errors.email ? true : undefined}
                {...register('email')}
              />
              {errors.email && (
                <p className="text-sm text-destructive">{errors.email.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                aria-invalid={errors.password ? true : undefined}
                {...register('password')}
              />
              {errors.password && (
                <p className="text-sm text-destructive">{errors.password.message}</p>
              )}
            </div>
            {submitError && (
              <p role="alert" className="text-sm text-destructive">
                {submitError}
              </p>
            )}
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
              Entrar
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  )
}
