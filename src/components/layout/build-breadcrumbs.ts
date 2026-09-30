export interface BreadcrumbItem {
  label: string
  to: string
}

export const ROUTE_LABELS: Record<string, string> = {
  meters: 'Medidores',
  anomalies: 'Anomalías',
}

/**
 * Derives the breadcrumb trail from a pathname.
 * The first item is always "Dashboard"; unlabeled segments are shown as-is so future
 * routes never break the trail.
 *
 * @param pathname - Current location pathname (e.g. `/meters`).
 * @returns Breadcrumb items, each with the cumulative path up to its segment.
 */
export function buildBreadcrumbs(pathname: string): BreadcrumbItem[] {
  const segments = pathname.split('/').filter(Boolean)
  const items: BreadcrumbItem[] = [{ label: 'Dashboard', to: '/' }]

  segments.forEach((segment, index) => {
    items.push({
      label: ROUTE_LABELS[segment] ?? segment,
      to: `/${segments.slice(0, index + 1).join('/')}`,
    })
  })

  return items
}
