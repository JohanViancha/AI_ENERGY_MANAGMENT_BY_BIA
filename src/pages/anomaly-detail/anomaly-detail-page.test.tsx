import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AxiosError } from 'axios'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { AnomalyDetailPage } from '@/pages/anomaly-detail/anomaly-detail-page'
import { getAnomaly } from '@/services/anomalies.service'
import type { Anomaly } from '@/types/anomaly'

vi.mock('@/services/anomalies.service', () => ({ getAnomaly: vi.fn() }))

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
  reason: 'Consumo nocturno muy por encima del baseline',
  recommendedAction: 'Enviar una cuadrilla a revisar el medidor',
  evidence: {
    baselineKwh: 100,
    observedKwh: 250.5,
    variationPct: 150.5,
    signals: ['Pico sostenido', 'Factor de potencia bajo'],
    windowStart: '2026-09-29T08:00:00.000Z',
    windowEnd: '2026-09-29T10:00:00.000Z',
    relatedEvents: ['ev-1', 'ev-2'],
    detectorScores: { zscore: 0.91, isolation_forest: 0.4 },
  },
}

function renderPage(id = 'an-x1') {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={[`/anomalies/${id}`]}>
        <Routes>
          <Route path="/anomalies/:id" element={<AnomalyDetailPage />} />
          <Route path="/anomalies" element={<div>Lista de anomalías</div>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

function buildHttpError(status: number) {
  return new AxiosError('error', String(status), undefined, undefined, { status } as never)
}

describe('AnomalyDetailPage', () => {
  beforeEach(() => {
    vi.mocked(getAnomaly).mockReset()
    vi.mocked(getAnomaly).mockResolvedValue(anomaly)
  })

  it('muestra cabecera, motivo, evidencia y acción recomendada', async () => {
    renderPage()

    expect(await screen.findByRole('heading', { name: /M-109/ })).toBeInTheDocument()
    expect(getAnomaly).toHaveBeenCalledWith('an-x1')
    expect(screen.getByText('Alta')).toBeInTheDocument()
    expect(screen.getByText('Anomalía real')).toBeInTheDocument()
    expect(screen.getByText('92,3')).toBeInTheDocument()
    expect(screen.getByText('87 %')).toBeInTheDocument()
    expect(screen.getByText('Abierta')).toBeInTheDocument()
    expect(screen.getByText('Consumo nocturno muy por encima del baseline')).toBeInTheDocument()
    expect(screen.getByText('Enviar una cuadrilla a revisar el medidor')).toBeInTheDocument()
  })

  it('enlaza el medidor a su detalle', async () => {
    renderPage()

    const link = await screen.findByRole('link', { name: 'M-109' })

    expect(link).toHaveAttribute('href', '/meters/M-109')
  })

  it('muestra baseline, observado, variación, ventana, señales y puntajes', async () => {
    renderPage()

    await screen.findByText('Baseline')
    expect(screen.getByText('100,0 kWh')).toBeInTheDocument()
    expect(screen.getByText('250,5 kWh')).toBeInTheDocument()
    expect(screen.getByText('+150,5 %')).toBeInTheDocument()
    expect(screen.getByText(/Ventana:/)).toBeInTheDocument()
    expect(screen.getByText('Pico sostenido')).toBeInTheDocument()
    expect(screen.getByText('Factor de potencia bajo')).toBeInTheDocument()
    expect(screen.getByText('zscore')).toBeInTheDocument()
    expect(screen.getByText('0,91')).toBeInTheDocument()
    expect(screen.getByText('0,40')).toBeInTheDocument()
  })

  it('no muestra eventos correlacionados', async () => {
    renderPage()

    await screen.findByText('Baseline')

    expect(screen.queryByText(/evento/i)).not.toBeInTheDocument()
    expect(screen.queryByText('ev-1')).not.toBeInTheDocument()
  })

  it('muestra "Sin información disponible" cuando reason y recommendedAction son null', async () => {
    vi.mocked(getAnomaly).mockResolvedValue({
      ...anomaly,
      reason: null,
      recommendedAction: null,
    })

    renderPage()

    expect(await screen.findAllByText('Sin información disponible')).toHaveLength(2)
    expect(screen.getByText('Baseline')).toBeInTheDocument()
  })

  it('muestra "Anomalía no encontrada" con enlace a la lista ante un 404, sin alerta', async () => {
    vi.mocked(getAnomaly).mockRejectedValue(buildHttpError(404))

    renderPage('no-existe')

    expect(await screen.findByText('Anomalía no encontrada')).toBeInTheDocument()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()

    await userEvent.click(screen.getByRole('link', { name: 'Volver a anomalías' }))
    expect(screen.getByText('Lista de anomalías')).toBeInTheDocument()
  })

  it('muestra skeletons mientras carga', () => {
    vi.mocked(getAnomaly).mockReturnValue(new Promise(() => undefined))

    const { container } = renderPage()

    expect(container.querySelector('[aria-busy="true"]')).toBeInTheDocument()
  })

  it('muestra ErrorState y "Reintentar" recarga la anomalía', async () => {
    vi.mocked(getAnomaly).mockRejectedValueOnce(buildHttpError(500))

    renderPage()

    const alert = await screen.findByRole('alert')
    expect(within(alert).getByText('No se pudo cargar la anomalía')).toBeInTheDocument()

    await userEvent.click(within(alert).getByRole('button', { name: 'Reintentar' }))

    expect(await screen.findByText('Baseline')).toBeInTheDocument()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })
})
