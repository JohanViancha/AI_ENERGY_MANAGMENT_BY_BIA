import { LayoutDashboard } from 'lucide-react'

import { EmptyState } from '@/components/shared/empty-state'

/** Pantalla protegida `/`; placeholder hasta el SPEC 03. */
export function DashboardPage() {
  return (
    <EmptyState
      icon={LayoutDashboard}
      title="Dashboard"
      description="Aquí se mostrará el resumen de consumo energético."
    />
  )
}
