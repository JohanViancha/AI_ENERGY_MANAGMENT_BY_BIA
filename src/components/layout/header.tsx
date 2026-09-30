import { Menu } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

import { Breadcrumbs } from '@/components/layout/breadcrumbs'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/hooks/use-auth'

export interface HeaderProps {
  onOpenMobileNav: () => void
}

/** Top bar: hamburger (< lg), breadcrumbs, user email and Logout. */
export function Header({ onOpenMobileNav }: HeaderProps) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await logout()
    navigate('/login', { replace: true })
  }

  return (
    <header className="flex h-14 items-center gap-3 border-b bg-background px-4">
      <Button
        variant="ghost"
        size="icon"
        className="lg:hidden"
        aria-label="Abrir menú de navegación"
        onClick={onOpenMobileNav}
      >
        <Menu className="h-5 w-5" aria-hidden="true" />
      </Button>
      <div className="min-w-0 flex-1">
        <Breadcrumbs />
      </div>
      <span className="hidden truncate text-sm text-muted-foreground sm:inline">
        {user?.email}
      </span>
      <Button variant="outline" onClick={handleLogout}>
        Logout
      </Button>
    </header>
  )
}
