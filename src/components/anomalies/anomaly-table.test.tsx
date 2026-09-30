import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'

import { AnomalyFilters } from '@/components/anomalies/anomaly-filters'
import { DEFAULT_ANOMALY_LIST_PARAMS } from '@/components/anomalies/anomaly-list-params'
import { AnomalyTable } from '@/components/anomalies/anomaly-table'
import { ConfidenceIndicator } from '@/components/anomalies/confidence-indicator'
import type { Anomaly } from '@/types/anomaly'

const anomaly: Anomaly = {
  id: 'an-x1',
  meterId: 'M-109',
  analysisId: 'an-1',
  detectedAt: '2026-09-29T10:00:00.000Z',
  type: 'REAL_ANOMALY',
  severity: 'HIGH',
  confidence: 0.87,
  priorityScore: 92.34,
  status: 'OPEN',
  reason: null,
  recommendedAction: null,
  evidence: {
    baselineKwh: 1,
    observedKwh: 2,
    variationPct: 100,
    signals: [],
    windowStart: '2026-09-29T09:00:00.000Z',
    windowEnd: '2026-09-29T10:00:00.000Z',
    relatedEvents: [],
    detectorScores: {},
  },
}

function renderTable(anomalies: Anomaly[]) {
  return render(
    <MemoryRouter initialEntries={['/anomalies']}>
      <Routes>
        <Route path="/anomalies" element={<AnomalyTable anomalies={anomalies} />} />
        <Route path="/anomalies/:id" element={<p>Expediente</p>} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('AnomalyTable', () => {
  it('muestra prioridad, medidor y "—" cuando no hay acción recomendada', () => {
    renderTable([anomaly])

    expect(screen.getByText('92,3')).toBeInTheDocument()
    expect(screen.getByText('M-109')).toBeInTheDocument()
    expect(screen.getByText('87 %')).toBeInTheDocument()
    expect(screen.getByText('—')).toBeInTheDocument()
  })

  it('navega al expediente al pulsar la fila', async () => {
    renderTable([anomaly])

    await userEvent.click(screen.getByText('M-109'))

    expect(screen.getByText('Expediente')).toBeInTheDocument()
  })

  it('navega al expediente con Enter sobre la fila', async () => {
    renderTable([anomaly])

    const row = screen.getAllByRole('row')[1]
    row.focus()
    await userEvent.keyboard('{Enter}')

    expect(screen.getByText('Expediente')).toBeInTheDocument()
  })
})

describe('AnomalyFilters', () => {
  it('emite los params al cambiar cada select y ofrece los medidores dados', async () => {
    const onChange = vi.fn()
    render(
      <AnomalyFilters
        params={DEFAULT_ANOMALY_LIST_PARAMS}
        meterIds={['M-101', 'M-109']}
        onChange={onChange}
      />,
    )

    await userEvent.selectOptions(screen.getByLabelText('Severidad'), 'HIGH')
    await userEvent.selectOptions(screen.getByLabelText('Tipo'), 'DATA_QUALITY')
    await userEvent.selectOptions(screen.getByLabelText('Medidor'), 'M-109')

    expect(onChange).toHaveBeenNthCalledWith(1, {
      ...DEFAULT_ANOMALY_LIST_PARAMS,
      severity: 'HIGH',
    })
    expect(onChange).toHaveBeenNthCalledWith(2, {
      ...DEFAULT_ANOMALY_LIST_PARAMS,
      type: 'DATA_QUALITY',
    })
    expect(onChange).toHaveBeenNthCalledWith(3, {
      ...DEFAULT_ANOMALY_LIST_PARAMS,
      meterId: 'M-109',
    })
  })
})

describe('ConfidenceIndicator', () => {
  it('muestra la confianza como porcentaje en texto', () => {
    render(<ConfidenceIndicator confidence={0.5} />)

    expect(screen.getByText('50 %')).toBeInTheDocument()
  })
})
