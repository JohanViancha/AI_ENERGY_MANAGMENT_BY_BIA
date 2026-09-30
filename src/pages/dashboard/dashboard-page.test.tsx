import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { DashboardPage } from '@/pages/dashboard/dashboard-page'
import { getDashboardSummary } from '@/services/dashboard.service'
import { getMeters } from '@/services/meters.service'
import type { DashboardSummary } from '@/types/dashboard'
import type { MeterSummary } from '@/types/meter'

vi.mock('@/services/meters.service', () => ({ getMeters: vi.fn() }))
vi.mock('@/services/dashboard.service', () => ({ getDashboardSummary: vi.fn() }))

const meters: MeterSummary[] = [
  {
    meterId: 'M-101',
    lastReadingAt: '2026-09-29T12:00:00.000Z',
    lastConsumptionKwh: 1000.5,
    openAnomaliesCount: 0,
    highSeverityOpenCount: 0,
  },
  {
    meterId: 'M-102',
    lastReadingAt: '2026-09-29T12:00:00.000Z',
    lastConsumptionKwh: 234,
    openAnomaliesCount: 2,
    highSeverityOpenCount: 1,
  },
  {
    meterId: 'M-103',
    lastReadingAt: null,
    lastConsumptionKwh: null,
    openAnomaliesCount: 0,
    highSeverityOpenCount: 0,
  },
]

const summary: DashboardSummary = {
  analysisId: 'an-1',
  finishedAt: '2026-09-29T12:00:00.000Z',
  anomaliesCount: 17,
  bySeverity: { HIGH: 5, MEDIUM: 8, LOW: 4 },
  byType: { REAL_ANOMALY: 9, FALSE_POSITIVE: 3, DATA_QUALITY: 5 },
  avgConfidence: 0.87,
}

function renderPage() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={client}>
      <DashboardPage />
    </QueryClientProvider>,
  )
}

function cardOf(title: string) {
  const heading = screen.getByText(title)
  return within(heading.closest('[aria-busy], div.rounded-lg') as HTMLElement)
}

describe('DashboardPage', () => {
  beforeEach(() => {
    vi.mocked(getMeters).mockReset()
    vi.mocked(getDashboardSummary).mockReset()
  })

  it('muestra las 6 tarjetas KPI y el panel con datos del backend', async () => {
    vi.mocked(getMeters).mockResolvedValue(meters)
    vi.mocked(getDashboardSummary).mockResolvedValue(summary)

    renderPage()

    expect(await screen.findByText('17')).toBeInTheDocument()
    expect(cardOf('Medidores').getByText('3')).toBeInTheDocument()
    expect(cardOf('Consumo actual').getByText('1.234,5 kWh')).toBeInTheDocument()
    expect(cardOf('Anomalías detectadas').getByText('17')).toBeInTheDocument()
    expect(cardOf('Prioridad alta').getByText('5')).toBeInTheDocument()
    expect(cardOf('Confianza IA').getByText('87 %')).toBeInTheDocument()
    expect(screen.getByText('Último análisis')).toBeInTheDocument()
    expect(screen.getByText('Anomalías por severidad')).toBeInTheDocument()
    expect(screen.getByText('Anomalías por tipo')).toBeInTheDocument()
    expect(screen.getByText('Anomalía real')).toBeInTheDocument()
  })

  it('muestra "Aún no hay análisis" sin error cuando analysisId es null', async () => {
    vi.mocked(getMeters).mockResolvedValue(meters)
    vi.mocked(getDashboardSummary).mockResolvedValue({
      analysisId: null,
      finishedAt: null,
      anomaliesCount: 0,
      bySeverity: { HIGH: 0, MEDIUM: 0, LOW: 0 },
      byType: {},
      avgConfidence: null,
    })

    renderPage()

    expect(await screen.findByText('Aún no hay análisis')).toBeInTheDocument()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    expect(screen.queryByText('Anomalías por severidad')).not.toBeInTheDocument()
    expect(screen.getByText('Medidores')).toBeInTheDocument()
  })

  it('muestra skeletons mientras cargan los datos', () => {
    vi.mocked(getMeters).mockReturnValue(new Promise(() => undefined))
    vi.mocked(getDashboardSummary).mockReturnValue(new Promise(() => undefined))

    const { container } = renderPage()

    expect(container.querySelectorAll('[aria-busy="true"]').length).toBeGreaterThanOrEqual(7)
  })

  it('muestra ErrorState y "Reintentar" recarga el bloque que falló', async () => {
    vi.mocked(getMeters).mockResolvedValue(meters)
    vi.mocked(getDashboardSummary).mockRejectedValueOnce(new Error('boom'))
    vi.mocked(getDashboardSummary).mockResolvedValue(summary)

    renderPage()

    const alert = await screen.findByRole('alert')
    expect(within(alert).getByText('No se pudo cargar el resumen de anomalías')).toBeInTheDocument()
    // El fallo de un bloque no bloquea al resto.
    expect(cardOf('Medidores').getByText('3')).toBeInTheDocument()

    await userEvent.click(within(alert).getByRole('button', { name: 'Reintentar' }))

    expect(await screen.findByText('Anomalías por severidad')).toBeInTheDocument()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })
})
