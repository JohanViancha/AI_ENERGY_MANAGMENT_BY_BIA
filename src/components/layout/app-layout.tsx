import { useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'

import { Header } from '@/components/layout/header'
import { Sidebar } from '@/components/layout/sidebar'
import { Sheet, SheetContent, SheetDescription, SheetTitle } from '@/components/ui/sheet'

/** Shell for protected routes: fixed sidebar on lg+, drawer below, header and page outlet. */
export function AppLayout() {
  const { pathname } = useLocation()
  // The drawer is open only for the pathname it was opened on, so navigating closes it
  // without a setState-in-effect.
  const [mobileNavOpenedAt, setMobileNavOpenedAt] = useState<string | null>(null)
  const isMobileNavOpen = mobileNavOpenedAt === pathname

  return (
    <div className="min-h-screen lg:pl-64">
      <aside className="fixed inset-y-0 left-0 hidden w-64 border-r bg-background lg:block">
        <Sidebar />
      </aside>

      <Sheet open={isMobileNavOpen} onOpenChange={(open) => setMobileNavOpenedAt(open ? pathname : null)}>
        <SheetContent side="left" className="w-64 p-0 lg:hidden">
          <SheetTitle className="sr-only">Menú de navegación</SheetTitle>
          <SheetDescription className="sr-only">Enlaces principales de la aplicación</SheetDescription>
          <Sidebar />
        </SheetContent>
      </Sheet>

      <div className="flex min-h-screen flex-col">
        <Header onOpenMobileNav={() => setMobileNavOpenedAt(pathname)} />
        <main className="flex-1 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
