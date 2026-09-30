import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { toChartPoints } from '@/components/charts/chart-data'
import { ConsumptionChart } from '@/components/charts/consumption-chart'
import { MetricChart } from '@/components/charts/metric-chart'
import type { Reading } from '@/types/reading'

const readings: Reading[] = [
  {
    meterId: 'M-101',
    timestamp: '2026-09-29T11:00:00.000Z',
    consumptionKwh: 12,
    voltage: 220,
    current: 5,
    powerFactor: 0.95,
    status: 'ESTIMATED',
  },
  {
    meterId: 'M-101',
    timestamp: '2026-09-29T10:00:00.000Z',
    consumptionKwh: 10,
    voltage: 219,
    current: 4.5,
    powerFactor: 0.96,
    status: 'OK',
  },
]

describe('ConsumptionChart', () => {
  it('muestra el EmptyState cuando no hay lecturas', () => {
    render(<ConsumptionChart data={[]} anomalies={[]} ariaLabel="Consumo de M-101" />)

    expect(screen.getByText('Sin lecturas')).toBeInTheDocument()
    expect(screen.queryByRole('img')).not.toBeInTheDocument()
  })

  it('expone un aria-label descriptivo cuando hay lecturas', () => {
    render(<ConsumptionChart data={readings} anomalies={[]} ariaLabel="Consumo de M-101" />)

    expect(screen.getByRole('img', { name: 'Consumo de M-101' })).toBeInTheDocument()
    expect(screen.queryByText('Sin lecturas')).not.toBeInTheDocument()
  })
})

describe('MetricChart', () => {
  it('muestra el EmptyState cuando no hay lecturas', () => {
    render(
      <MetricChart
        title="Voltaje (V)"
        metric="voltage"
        data={[]}
        formatValue={String}
        ariaLabel="Voltaje de M-101"
      />,
    )

    expect(screen.getByText('Voltaje (V)')).toBeInTheDocument()
    expect(screen.getByText('Sin lecturas')).toBeInTheDocument()
  })

  it('expone un aria-label descriptivo cuando hay lecturas', () => {
    render(
      <MetricChart
        title="Voltaje (V)"
        metric="voltage"
        data={readings}
        formatValue={String}
        ariaLabel="Voltaje de M-101"
      />,
    )

    expect(screen.getByRole('img', { name: 'Voltaje de M-101' })).toBeInTheDocument()
  })
})

describe('toChartPoints', () => {
  it('proyecta la métrica, conserva el status y ordena por tiempo', () => {
    const points = toChartPoints(readings, 'voltage')

    expect(points.map((point) => point.value)).toEqual([219, 220])
    expect(points.map((point) => point.status)).toEqual(['OK', 'ESTIMATED'])
    expect(points[0].time).toBeLessThan(points[1].time)
  })
})
