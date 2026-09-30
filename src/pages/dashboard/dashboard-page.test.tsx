import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { DashboardPage } from '@/pages/dashboard/dashboard-page'
import { startAnalysis } from '@/services/ai.service'
import { subscribeToAnalysis } from '@/services/analysis-stream.service'
import { getDashboardSummary } from '@/services/dashboard.service'
import { getMeters } from '@/services/meters.service'
import type { Analysis } from '@/types/analysis'
import type { DashboardSummary } from '@/types/dashboard'
import type { MeterSummary } from '@/types/meter'

vi.mock('@/services/meters.service', () => ({ getMeters: vi.fn() }))
vi.mock('@/services/dashboard.service', () => ({
  getDashboardSummary: vi.fn(),
}))
vi.mock('@/services/ai.service', () => ({
  startAnalysis: vi.fn(),
  getAnalysis: vi.fn(),
}))
vi.mock('@/services/analysis-stream.service', () => ({
  subscribeToAnalysis: vi.fn(),
}))

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
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
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
    vi.mocked(startAnalysis).mockReset()
    vi.mocked(subscribeToAnalysis).mockReset()
    sessionStorage.clear()
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

  describe('Run AI Analysis', () => {
    type Handlers = Parameters<typeof subscribeToAnalysis>[1]
    let handlers: Handlers

    function buildAnalysis(overrides: Partial<Analysis> = {}): Analysis {
      return {
        id: 'an-2',
        startedAt: '2026-09-29T13:00:00.000Z',
        finishedAt: null,
        status: 'RUNNING',
        errorCode: null,
        errorMessage: null,
        triggeredBy: 'MANUAL',
        metersAnalyzed: [],
        progress: { phase: 'BASELINE', pct: 20 },
        anomaliesCount: 0,
        highPriorityCount: 0,
        ...overrides,
      }
    }

    beforeEach(() => {
      vi.mocked(getMeters).mockResolvedValue(meters)
      vi.mocked(getDashboardSummary).mockResolvedValue(summary)
      vi.mocked(startAnalysis).mockResolvedValue({
        analysisId: 'an-2',
        status: 'RUNNING',
      })
      vi.mocked(subscribeToAnalysis).mockImplementation((_id, subscriptionHandlers) => {
        handlers = subscriptionHandlers
        return vi.fn()
      })
    })

    it('lanza una sola corrida, muestra el progreso y deshabilita el botón', async () => {
      renderPage()
      const button = await screen.findByRole('button', {
        name: 'Run AI Analysis',
      })

      await userEvent.click(button)
      await waitFor(() => expect(subscribeToAnalysis).toHaveBeenCalled())
      act(() => handlers.onNext(buildAnalysis()))

      expect(startAnalysis).toHaveBeenCalledTimes(1)
      expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '20')
      expect(button).toBeDisabled()
      expect(button).toHaveAttribute('aria-busy', 'true')
    })

    it('refresca los KPI y rehabilita el botón al completar', async () => {
      renderPage()
      await userEvent.click(await screen.findByRole('button', { name: 'Run AI Analysis' }))
      await waitFor(() => expect(subscribeToAnalysis).toHaveBeenCalled())
      expect(await screen.findByText('17')).toBeInTheDocument()
      vi.mocked(getDashboardSummary).mockResolvedValue({
        ...summary,
        anomaliesCount: 21,
      })

      act(() =>
        handlers.onNext(
          buildAnalysis({
            status: 'COMPLETED',
            progress: { phase: 'RECOMMENDATION', pct: 100 },
          }),
        ),
      )

      expect(await screen.findByText('21')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Run AI Analysis' })).toBeEnabled()
      expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '100')
    })

    it('muestra el error del POST en línea y deja el botón habilitado', async () => {
      vi.mocked(startAnalysis).mockRejectedValue(new Error('boom'))
      renderPage()

      await userEvent.click(await screen.findByRole('button', { name: 'Run AI Analysis' }))

      expect(await screen.findByRole('alert')).toHaveTextContent(
        'No se pudo completar la solicitud',
      )
      expect(screen.getByRole('button', { name: 'Run AI Analysis' })).toBeEnabled()
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument()
    })
  })
})
