import { Link } from 'react-router-dom'

/** Página 404 mínima para rutas inexistentes. */
export function NotFoundPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-2">
      <h1 className="text-2xl font-semibold">404</h1>
      <p className="text-muted-foreground">Página no encontrada</p>
      <Link to="/" className="text-sm underline underline-offset-4">
        Volver al inicio
      </Link>
    </main>
  )
}
