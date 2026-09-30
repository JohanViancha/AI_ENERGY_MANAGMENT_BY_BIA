import type { LucideIcon } from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

export interface KpiCardProps {
  title: string
  value: string
  description?: string
  icon: LucideIcon
  isLoading?: boolean
}

/** Tarjeta de un indicador; reserva el alto del valor para que no salte al cargar. */
export function KpiCard({ title, value, description, icon: Icon, isLoading = false }: KpiCardProps) {
  return (
    <Card aria-busy={isLoading || undefined}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <>
            <Skeleton className="h-8 w-24" />
            <Skeleton className="mt-2 h-4 w-32" />
          </>
        ) : (
          <>
            <p className="h-8 text-2xl font-semibold">{value}</p>
            <p className="mt-2 h-4 text-xs text-muted-foreground">{description}</p>
          </>
        )}
      </CardContent>
    </Card>
  )
}
