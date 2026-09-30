import { Zap } from 'lucide-react'
import { NavLink } from 'react-router-dom'

import { NAV_ITEMS } from '@/components/layout/nav-items'
import { cn } from '@/lib/utils'

/** Navigation content shared by the fixed desktop sidebar and the mobile drawer. */
export function Sidebar() {
  return (
    <div className="flex h-full flex-col gap-6 p-4">
      <div className="flex items-center gap-2 px-2 text-lg font-semibold">
        <Zap className="h-5 w-5" aria-hidden="true" />
        <span>Energy Manager</span>
      </div>
      <nav aria-label="Navegación principal">
        <ul className="flex flex-col gap-1">
          {NAV_ITEMS.map(({ label, to, icon: Icon, end }) => (
            <li key={to}>
              <NavLink
                to={to}
                end={end}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
                  )
                }
              >
                <Icon className="h-4 w-4" aria-hidden="true" />
                {label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  )
}
