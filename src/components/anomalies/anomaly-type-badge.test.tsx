import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { AnomalyTypeBadge } from '@/components/anomalies/anomaly-type-badge'

describe('AnomalyTypeBadge', () => {
  it.each([
    ['REAL_ANOMALY', 'Anomalía real'],
    ['EXPLAINABLE_ANOMALY', 'Explicable'],
    ['FALSE_POSITIVE', 'Falso positivo'],
    ['DATA_QUALITY', 'Calidad de datos'],
  ] as const)('muestra "%s" como "%s"', (type, label) => {
    render(<AnomalyTypeBadge type={type} />)

    expect(screen.getByText(label)).toBeInTheDocument()
  })
})
