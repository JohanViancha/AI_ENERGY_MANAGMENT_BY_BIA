import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { AnomaliesPage } from '@/pages/anomalies/anomalies-page'
import { getAnomalies } from '@/services/anomalies.service'
import { getDashboardSummary } from '@/services/dashboard.service'
import type { Anomaly } from '@/types/anomaly'
import type { DashboardSummary } from '@/types/dashboard'

vi.mock('@/services/anomalies.service', () => ({ getAnomalies: vi.fn() }))
vi.mock('@/services/dashboard.service', () => ({ getDashboardSummary: vi.fn() }))

function buildAnomaly(overrides: Partial<Anomaly> & { id: string }): Anomaly {
  return {
    meterId: 'M-101',
    analysisId: 'an-1',
    detectedAt: '2026-09-29T10:00:00.000Z',
    type: 'REAL_ANOMALY',
    severity: 'HIGH',
    confidence: 0.9,
    priorityScore: 50,
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
    ...overrides,
  }
}

const anomalies: Anomaly[] = [
  buildAnomaly({ id: 'a-low', priorityScore: 20.5, severity: 'LOW', meterId: 'M-102' }),
  buildAnomaly({ id: 'a-top', priorityScore: 95, meterId: 'M-109' }),
  buildAnomaly({
    id: 'a-mid',
    priorityScore: 60,
    severity: 'MEDIUM',
    type: 'FALSE_POSITIVE',
    meterId: 'M-101',
  }),
]

const summary: DashboardSummary = {
  analysisId: 'an-1',
  finishedAt: '2026-09-29T12:00:00.000Z',
  anomaliesCount: 3,
  bySeverity: { HIGH: 1, MEDIUM: 1, LOW: 1 },
  byType: {},
  avgConfidence: 0.9,
}

function LocationDisplay() {
  const { pathname, search } = useLocation()
  return <div data-testid="location">{pathname + search}</div>
}

function renderPage(initialEntry = '/anomalies') {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={[initialEntry]}>
        <LocationDisplay />
        <Routes>
          <Route path="/anomalies" element={<AnomaliesPage />} />
          <Route path="/anomalies/:id" element={<div>Expediente</div>} />
          <Route path="/" element={<div>Inicio</div>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

function bodyRows() {
  return screen.getAllByRole('row').slice(1)
}

describe('AnomaliesPage', () => {
  beforeEach(() => {
    vi.mocked(getAnomalies).mockReset()
    vi.mocked(getDashboardSummary).mockReset()
    vi.mocked(getDashboardSummary).mockResolvedValue(summary)
    vi.mocked(getAnomalies).mockResolvedValue(anomalies)
  })

  it('pide las anomalías de la última corrida y las ordena por prioridad descendente', async () => {
    renderPage()

    await screen.findByText('M-109', { selector: 'td' })
    expect(getAnomalies).toHaveBeenCalledWith({ analysisId: 'an-1' })
    const scores = bodyRows().map((row) => within(row).getAllByRole('cell')[0].textContent)
    expect(scores).toEqual(['95,0', '60,0', '20,5'])
  })

  it('filtra por severidad y refleja el filtro en la URL', async () => {
    renderPage()
    await screen.findByText('M-109', { selector: 'td' })

    await userEvent.selectOptions(screen.getByLabelText('Severidad'), 'HIGH')

    expect(bodyRows()).toHaveLength(1)
    expect(screen.getByTestId('location')).toHaveTextContent('/anomalies?severity=HIGH')
  })

  it('combina severidad, tipo y medidor leídos de la URL', async () => {
    renderPage('/anomalies?severity=MEDIUM&type=FALSE_POSITIVE&meterId=M-101')

    await screen.findByText('M-101', { selector: 'td' })

    expect(bodyRows()).toHaveLength(1)
    expect(screen.getByLabelText('Severidad')).toHaveValue('MEDIUM')
    expect(screen.getByLabelText('Medidor')).toHaveValue('M-101')
  })

  it('un severity inválido en la URL cae a "Todos" sin error', async () => {
    renderPage('/anomalies?severity=CRITICAL')

    await screen.findByText('M-109', { selector: 'td' })

    expect(bodyRows()).toHaveLength(3)
    expect(screen.getByLabelText('Severidad')).toHaveValue('ALL')
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('muestra "Aún no hay análisis" con enlace al Dashboard y sin pedir anomalías', async () => {
    vi.mocked(getDashboardSummary).mockResolvedValue({ ...summary, analysisId: null })

    renderPage()

    expect(await screen.findByText('Aún no hay análisis')).toBeInTheDocument()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    expect(getAnomalies).not.toHaveBeenCalled()

    await userEvent.click(screen.getByRole('link', { name: 'Ir al Dashboard' }))
    expect(screen.getByText('Inicio')).toBeInTheDocument()
  })

  it('muestra "Ninguna anomalía coincide" y "Limpiar filtros" restablece la lista', async () => {
    renderPage('/anomalies?severity=LOW&meterId=M-109')

    expect(await screen.findByText('Ninguna anomalía coincide')).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: 'Limpiar filtros' }))

    expect(await screen.findAllByRole('row')).toHaveLength(4)
    expect(screen.getByTestId('location')).toHaveTextContent(/^\/anomalies$/)
  })

  it('muestra "Sin anomalías detectadas" cuando la corrida no encontró ninguna', async () => {
    vi.mocked(getAnomalies).mockResolvedValue([])

    renderPage()

    expect(await screen.findByText('Sin anomalías detectadas')).toBeInTheDocument()
  })

  it('navega al expediente al pulsar una fila', async () => {
    renderPage()

    await userEvent.click(await screen.findByText('M-109', { selector: 'td' }))

    expect(screen.getByText('Expediente')).toBeInTheDocument()
    expect(screen.getByTestId('location')).toHaveTextContent('/anomalies/a-top')
  })

  it('muestra skeletons mientras carga', () => {
    vi.mocked(getDashboardSummary).mockReturnValue(new Promise(() => undefined))

    const { container } = renderPage()

    expect(container.querySelector('[aria-busy="true"]')).toBeInTheDocument()
  })

  it('muestra ErrorState y "Reintentar" recarga las anomalías', async () => {
    vi.mocked(getAnomalies).mockRejectedValueOnce(new Error('boom'))

    renderPage()

    const alert = await screen.findByRole('alert')
    expect(within(alert).getByText('No se pudieron cargar las anomalías')).toBeInTheDocument()

    await userEvent.click(within(alert).getByRole('button', { name: 'Reintentar' }))

    expect(await screen.findByText('M-109', { selector: 'td' })).toBeInTheDocument()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })
})
