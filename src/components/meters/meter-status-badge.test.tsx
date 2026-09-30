import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { MeterStatusBadge } from '@/components/meters/meter-status-badge'

describe('MeterStatusBadge', () => {
  it.each([
    ['OK', 'Normal'],
    ['ALERT', 'Alerta'],
    ['CRITICAL', 'Crítico'],
  ] as const)('muestra "%s" como "%s"', (status, label) => {
    render(<MeterStatusBadge status={status} />)

    expect(screen.getByText(label)).toBeInTheDocument()
  })
})
