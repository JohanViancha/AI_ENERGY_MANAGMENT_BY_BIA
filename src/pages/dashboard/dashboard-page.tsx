import { useNavigate } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import { useAuth } from '@/hooks/use-auth'

/** Pantalla protegida `/`; por ahora solo muestra el usuario y permite cerrar sesión. */
export function DashboardPage() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await logout()
    navigate('/login', { replace: true })
  }

  return (
    <main className="min-h-screen p-6">
      <header className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">{user?.email}</span>
        <Button variant="outline" onClick={handleLogout}>
          Logout
        </Button>
      </header>
    </main>
  )
}
