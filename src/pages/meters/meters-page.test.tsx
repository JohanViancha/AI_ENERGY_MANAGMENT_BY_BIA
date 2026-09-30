import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { MetersPage } from '@/pages/meters/meters-page'
import { getMeters } from '@/services/meters.service'
import type { MeterSummary } from '@/types/meter'

vi.mock('@/services/meters.service', () => ({ getMeters: vi.fn() }))

// M-101 a M-112: M-101 crítico, M-102 y M-103 en alerta, el resto normales.
const meters: MeterSummary[] = Array.from({ length: 12 }, (_, index) => {
  const number = 101 + index
  return {
    meterId: `M-${number}`,
    lastReadingAt: '2026-09-29T12:00:00.000Z',
    lastConsumptionKwh: (index + 1) * 10,
    openAnomaliesCount: number === 101 ? 3 : number <= 103 ? 1 : 0,
    highSeverityOpenCount: number === 101 ? 1 : 0,
  }
})

function LocationDisplay() {
  const { pathname, search } = useLocation()
  return <div data-testid="location">{pathname + search}</div>
}

function renderPage(initialEntry = '/meters') {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={[initialEntry]}>
        <LocationDisplay />
        <Routes>
          <Route path="/meters" element={<MetersPage />} />
          <Route path="/meters/:meterId" element={<div>Detalle</div>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

function bodyRows() {
  return screen.getAllByRole('row').slice(1)
}

describe('MetersPage', () => {
  beforeEach(() => {
    vi.mocked(getMeters).mockReset()
    vi.mocked(getMeters).mockResolvedValue(meters)
  })

  it('lista los 12 medidores con su estado', async () => {
    renderPage()

    await screen.findByText('M-101')
    expect(bodyRows()).toHaveLength(12)
    expect(within(bodyRows()[0]).getByText('Crítico')).toBeInTheDocument()
    expect(within(bodyRows()[1]).getByText('Alerta')).toBeInTheDocument()
    expect(within(bodyRows()[5]).getByText('Normal')).toBeInTheDocument()
  })

  it('muestra el conteo de cada tab', async () => {
    renderPage()

    expect(await screen.findByRole('tab', { name: 'Todos (12)' })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: 'Normales (9)' })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: 'Alertas (2)' })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: 'Críticos (1)' })).toBeInTheDocument()
  })

  it('filtra por estado y lo refleja en la URL', async () => {
    renderPage()

    await userEvent.click(await screen.findByRole('tab', { name: 'Críticos (1)' }))

    expect(bodyRows()).toHaveLength(1)
    expect(screen.getByText('M-101')).toBeInTheDocument()
    expect(screen.getByTestId('location')).toHaveTextContent('/meters?status=CRITICAL')
  })

  it('busca por meterId sin distinguir mayúsculas y lo refleja en la URL', async () => {
    renderPage()

    await userEvent.type(await screen.findByLabelText('Buscar medidor'), 'm-11')

    expect(bodyRows().map((row) => within(row).getAllByRole('cell')[0].textContent)).toEqual([
      'M-110',
      'M-111',
      'M-112',
    ])
    expect(screen.getByTestId('location')).toHaveTextContent('/meters?q=m-11')
    expect(screen.getByRole('tab', { name: 'Todos (3)' })).toBeInTheDocument()
  })

  it('ordena al pulsar un encabezado, invierte al repetir y actualiza aria-sort', async () => {
    renderPage()
    const header = (await screen.findByRole('button', { name: /Consumo actual/ })).closest('th')

    expect(header).toHaveAttribute('aria-sort', 'none')

    await userEvent.click(within(header as HTMLElement).getByRole('button'))
    expect(header).toHaveAttribute('aria-sort', 'ascending')
    expect(within(bodyRows()[0]).getByText('M-101')).toBeInTheDocument()

    await userEvent.click(within(header as HTMLElement).getByRole('button'))
    expect(header).toHaveAttribute('aria-sort', 'descending')
    expect(within(bodyRows()[0]).getByText('M-112')).toBeInTheDocument()
    expect(screen.getByTestId('location')).toHaveTextContent(
      '/meters?sort=lastConsumptionKwh&dir=desc',
    )
  })

  it('restaura la vista desde la URL', async () => {
    renderPage('/meters?status=ALERT&q=M-10')

    await screen.findByText('M-102')

    expect(bodyRows()).toHaveLength(2)
    expect(screen.getByRole('tab', { name: 'Alertas (2)', selected: true })).toBeInTheDocument()
    expect(screen.getByLabelText('Buscar medidor')).toHaveValue('M-10')
  })

  it('cae a "Todos" con un status inválido en la URL', async () => {
    renderPage('/meters?status=BOGUS')

    await screen.findByText('M-101')

    expect(bodyRows()).toHaveLength(12)
    expect(screen.getByRole('tab', { name: 'Todos (12)', selected: true })).toBeInTheDocument()
  })

  it('muestra "Ningún medidor coincide" y "Limpiar filtros" restablece la lista', async () => {
    renderPage('/meters?q=zzz')

    expect(await screen.findByText('Ningún medidor coincide')).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: 'Limpiar filtros' }))

    expect(await screen.findByText('M-101')).toBeInTheDocument()
    expect(bodyRows()).toHaveLength(12)
    expect(screen.getByTestId('location')).toHaveTextContent(/^\/meters$/)
  })

  it('navega al detalle al pulsar una fila', async () => {
    renderPage()

    await userEvent.click((await screen.findByText('M-109')).closest('tr') as HTMLElement)

    expect(screen.getByText('Detalle')).toBeInTheDocument()
    expect(screen.getByTestId('location')).toHaveTextContent('/meters/M-109')
  })

  it('navega al detalle con Enter sobre una fila', async () => {
    renderPage()
    const row = (await screen.findByText('M-105')).closest('tr') as HTMLElement

    row.focus()
    await userEvent.keyboard('{Enter}')

    expect(screen.getByTestId('location')).toHaveTextContent('/meters/M-105')
  })

  it('muestra skeletons mientras carga', () => {
    vi.mocked(getMeters).mockReturnValue(new Promise(() => undefined))

    const { container } = renderPage()

    expect(container.querySelector('[aria-busy="true"]')).toBeInTheDocument()
    expect(screen.queryByRole('table')).not.toBeInTheDocument()
  })

  it('muestra ErrorState y "Reintentar" carga la lista', async () => {
    vi.mocked(getMeters).mockReset()
    vi.mocked(getMeters).mockRejectedValueOnce(new Error('boom'))
    vi.mocked(getMeters).mockResolvedValue(meters)

    renderPage()

    const alert = await screen.findByRole('alert')
    await userEvent.click(within(alert).getByRole('button', { name: 'Reintentar' }))

    expect(await screen.findByText('M-101')).toBeInTheDocument()
    expect(bodyRows()).toHaveLength(12)
  })
})
