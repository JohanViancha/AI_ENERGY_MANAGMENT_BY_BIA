import { Gauge } from 'lucide-react'

import { EmptyState } from '@/components/shared/empty-state'

/** Pantalla protegida `/meters`; placeholder hasta el SPEC 03. */
export function MetersPage() {
  return (
    <EmptyState
      icon={Gauge}
      title="Medidores"
      description="Aquí se listarán tus medidores eléctricos."
    />
  )
}
