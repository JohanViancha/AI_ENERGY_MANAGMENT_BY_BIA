import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { SeverityBadge } from '@/components/anomalies/severity-badge'

describe('SeverityBadge', () => {
  it.each([
    ['LOW', 'Baja'],
    ['MEDIUM', 'Media'],
    ['HIGH', 'Alta'],
  ] as const)('muestra "%s" como "%s"', (severity, label) => {
    render(<SeverityBadge severity={severity} />)

    expect(screen.getByText(label)).toBeInTheDocument()
  })
})
