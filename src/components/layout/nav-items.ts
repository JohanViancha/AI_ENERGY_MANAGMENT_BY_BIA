import { AlertTriangle, Gauge, LayoutDashboard } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

export interface NavItem {
  label: string
  to: string
  icon: LucideIcon
  /** true en '/' para que no quede activo en todas las rutas. */
  end?: boolean
}

export const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', to: '/', icon: LayoutDashboard, end: true },
  { label: 'Medidores', to: '/meters', icon: Gauge },
  { label: 'Anomalías', to: '/anomalies', icon: AlertTriangle },
]
