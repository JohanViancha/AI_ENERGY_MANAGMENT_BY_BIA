import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AxiosError, type InternalAxiosRequestConfig } from 'axios'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { MeterDetailPage } from '@/pages/meter-detail/meter-detail-page'
import { getAnomalies } from '@/services/anomalies.service'
import { getMeter, getMeterReadings } from '@/services/meters.service'
import type { Anomaly } from '@/types/anomaly'
import type { MeterDetail } from '@/types/meter'

vi.mock('@/services/meters.service', () => ({
  getMeter: vi.fn(),
  getMeterReadings: vi.fn(),
}))
vi.mock('@/services/anomalies.service', () => ({ getAnomalies: vi.fn() }))

const LAST_READING_AT = '2026-09-29T12:00:00.000Z'
const HOUR_MS = 3_600_000

const meterDetail: MeterDetail = {
  meterId: 'M-109',
  lastReadingAt: LAST_READING_AT,
  lastConsumptionKwh: 1234.5,
  openAnomaliesCount: 3,
  highSeverityOpenCount: 1,
  totalReadingsCount: 2016,
  lastAnalysisId: 'an-1',
  anomaliesByType: { REAL_ANOMALY: 3 },
}

function buildAnomaly(index: number): Anomaly {
  return {
    id: `a-${index}`,
    meterId: 'M-109',
    analysisId: 'an-1',
    detectedAt: new Date(Date.UTC(2026, 8, index + 1, 10)).toISOString(),
    type: 'REAL_ANOMALY',
    severity: 'HIGH',
    confidence: 0.9,
    priorityScore: 80,
    status: 'OPEN',
    reason: `Motivo ${index}`,
    recommendedAction: null,
    evidence: {
      baselineKwh: 10,
      observedKwh: 30,
      variationPct: 200,
      signals: [],
      windowStart: '2026-09-28T10:00:00.000Z',
      windowEnd: '2026-09-28T14:00:00.000Z',
      relatedEvents: [],
      detectorScores: {},
    },
  }
}

function httpError(status: number) {
  const config = {} as InternalAxiosRequestConfig
  return new AxiosError('fail', String(status), config, null, {
    data: {},
    status,
    statusText: '',
    headers: {},
    config,
  })
}

function renderPage(path = '/meters/M-109') {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path="/meters/:meterId" element={<MeterDetailPage />} />
          <Route path="/meters" element={<div>Lista de medidores</div>} />
          <Route path="/anomalies/:id" element={<div>Expediente</div>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('MeterDetailPage', () => {
  beforeEach(() => {
    vi.mocked(getMeter).mockReset().mockResolvedValue(meterDetail)
    vi.mocked(getMeterReadings).mockReset().mockResolvedValue({ data: [], nextCursor: null })
    vi.mocked(getAnomalies)
      .mockReset()
      .mockResolvedValue([buildAnomaly(1), buildAnomaly(2)])
  })

  it('muestra el resumen, los 4 gráficos y las anomalías recientes', async () => {
    vi.mocked(getMeterReadings).mockResolvedValue({
      data: [
        {
          meterId: 'M-109',
          timestamp: LAST_READING_AT,
          consumptionKwh: 10,
          voltage: 220,
          current: 5,
          powerFactor: 0.95,
          status: 'OK',
        },
      ],
      nextCursor: null,
    })

    renderPage()

    expect(await screen.findByRole('heading', { name: 'M-109' })).toBeInTheDocument()
    expect(await screen.findByText('Crítico')).toBeInTheDocument()
    expect(screen.getByText('1.234,5 kWh')).toBeInTheDocument()
    expect(screen.getByText('2.016')).toBeInTheDocument()
    expect(await screen.findAllByRole('img')).toHaveLength(4)
    expect(screen.getByRole('img', { name: /Consumo en kWh de M-109/ })).toBeInTheDocument()
    expect(await screen.findByText('Motivo 1')).toBeInTheDocument()
    expect(getAnomalies).toHaveBeenCalledWith({ analysisId: 'an-1', meterId: 'M-109' })
  })

  it('muestra solo las 5 anomalías más recientes', async () => {
    vi.mocked(getAnomalies).mockResolvedValue(Array.from({ length: 7 }, (_, i) => buildAnomaly(i)))

    renderPage()

    await screen.findByText('Motivo 6')
    const rows = screen.getAllByRole('row').slice(1)
    expect(rows).toHaveLength(5)
    expect(within(rows[0]).getByText('Motivo 6')).toBeInTheDocument()
    expect(screen.queryByText('Motivo 0')).not.toBeInTheDocument()
    expect(screen.queryByText('Motivo 1')).not.toBeInTheDocument()
  })

  it('abre el expediente al pulsar una anomalía reciente', async () => {
    renderPage()

    await userEvent.click(await screen.findByText('Motivo 1'))
    expect(screen.getByText('Expediente')).toBeInTheDocument()
  })

  it('abre el expediente con Enter sobre la fila', async () => {
    renderPage()

    await screen.findByText('Motivo 1')
    screen.getAllByRole('row')[1].focus()
    await userEvent.keyboard('{Enter}')

    expect(screen.getByText('Expediente')).toBeInTheDocument()
  })

  it('muestra "Medidor no encontrado" con enlace a /meters ante un 404', async () => {
    vi.mocked(getMeter).mockRejectedValue(httpError(404))

    renderPage('/meters/M-999')

    expect(await screen.findByText('Medidor no encontrado')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Volver a medidores' })).toHaveAttribute(
      'href',
      '/meters',
    )
  })

  it('muestra ErrorState y "Reintentar" recarga el detalle ante otros errores', async () => {
    vi.mocked(getMeter).mockRejectedValueOnce(httpError(500))

    renderPage()

    const alert = await screen.findByRole('alert')
    await userEvent.click(within(alert).getByRole('button', { name: 'Reintentar' }))

    expect(await screen.findByText('Crítico')).toBeInTheDocument()
  })

  it('muestra "Este medidor aún no tiene análisis" sin pedir anomalías', async () => {
    vi.mocked(getMeter).mockResolvedValue({ ...meterDetail, lastAnalysisId: null })

    renderPage()

    expect(await screen.findByText('Este medidor aún no tiene análisis')).toBeInTheDocument()
    expect(getAnomalies).not.toHaveBeenCalled()
  })

  it('muestra "Sin lecturas" sin pedir lecturas cuando lastReadingAt es null', async () => {
    vi.mocked(getMeter).mockResolvedValue({
      ...meterDetail,
      lastReadingAt: null,
      lastConsumptionKwh: null,
    })

    renderPage()

    expect(await screen.findByText('Sin lecturas')).toBeInTheDocument()
    expect(screen.queryByRole('tab', { name: '24 h' })).not.toBeInTheDocument()
    expect(getMeterReadings).not.toHaveBeenCalled()
  })

  it('ancla el rango en lastReadingAt y recalcula from al cambiar de rango', async () => {
    renderPage()

    await screen.findByRole('tab', { name: '7 d', selected: true })
    await vi.waitFor(() => expect(getMeterReadings).toHaveBeenCalledTimes(1))
    const to = new Date(LAST_READING_AT).getTime()
    expect(getMeterReadings).toHaveBeenLastCalledWith('M-109', {
      from: new Date(to - 7 * 24 * HOUR_MS).toISOString(),
      to: LAST_READING_AT,
    })

    await userEvent.click(screen.getByRole('tab', { name: '24 h' }))

    await vi.waitFor(() => expect(getMeterReadings).toHaveBeenCalledTimes(2))
    expect(getMeterReadings).toHaveBeenLastCalledWith('M-109', {
      from: new Date(to - 24 * HOUR_MS).toISOString(),
      to: LAST_READING_AT,
    })
  })

  it('un fallo en las lecturas no impide ver el resumen ni las anomalías', async () => {
    vi.mocked(getMeterReadings).mockRejectedValue(httpError(500))

    renderPage()

    const alert = await screen.findByRole('alert')
    expect(within(alert).getByText('No se pudieron cargar las lecturas')).toBeInTheDocument()
    expect(screen.getByText('Crítico')).toBeInTheDocument()
    expect(await screen.findByText('Motivo 1')).toBeInTheDocument()
  })

  it('muestra skeletons mientras cargan los datos', () => {
    vi.mocked(getMeter).mockReturnValue(new Promise(() => undefined))

    const { container } = renderPage()

    expect(container.querySelectorAll('[aria-busy="true"]').length).toBeGreaterThan(0)
  })
})
