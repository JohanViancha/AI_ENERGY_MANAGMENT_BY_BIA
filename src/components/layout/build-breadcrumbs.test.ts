import { describe, expect, it } from 'vitest'

import { buildBreadcrumbs } from '@/components/layout/build-breadcrumbs'

describe('buildBreadcrumbs', () => {
  it('returns only Dashboard for the root path', () => {
    expect(buildBreadcrumbs('/')).toEqual([{ label: 'Dashboard', to: '/' }])
  })

  it('returns Dashboard / Medidores for /meters', () => {
    expect(buildBreadcrumbs('/meters')).toEqual([
      { label: 'Dashboard', to: '/' },
      { label: 'Medidores', to: '/meters' },
    ])
  })

  it('returns Dashboard / Anomalías for /anomalies', () => {
    expect(buildBreadcrumbs('/anomalies')).toEqual([
      { label: 'Dashboard', to: '/' },
      { label: 'Anomalías', to: '/anomalies' },
    ])
  })

  it('shows unknown segments as-is with their cumulative path', () => {
    expect(buildBreadcrumbs('/meters/abc')).toEqual([
      { label: 'Dashboard', to: '/' },
      { label: 'Medidores', to: '/meters' },
      { label: 'abc', to: '/meters/abc' },
    ])
  })

  it('ignores a trailing slash', () => {
    expect(buildBreadcrumbs('/meters/')).toEqual(buildBreadcrumbs('/meters'))
  })
})
