import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'

import { Sidebar } from '@/components/layout/sidebar'

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Sidebar />
    </MemoryRouter>,
  )
}

function getActiveLinks() {
  return screen
    .getAllByRole('link')
    .filter((link) => link.getAttribute('aria-current') === 'page')
}

describe('Sidebar', () => {
  it('renders exactly the Dashboard, Medidores and Anomalías links', () => {
    renderAt('/')

    const links = screen.getAllByRole('link')

    expect(links.map((link) => link.textContent)).toEqual(['Dashboard', 'Medidores', 'Anomalías'])
    expect(links.map((link) => link.getAttribute('href'))).toEqual(['/', '/meters', '/anomalies'])
  })

  it('marks only Dashboard as active on the root path', () => {
    renderAt('/')

    const active = getActiveLinks()

    expect(active).toHaveLength(1)
    expect(active[0]).toHaveTextContent('Dashboard')
  })

  it('marks only Medidores as active on /meters', () => {
    renderAt('/meters')

    const active = getActiveLinks()

    expect(active).toHaveLength(1)
    expect(active[0]).toHaveTextContent('Medidores')
  })

  it('marks only Anomalías as active on /anomalies', () => {
    renderAt('/anomalies')

    const active = getActiveLinks()

    expect(active).toHaveLength(1)
    expect(active[0]).toHaveTextContent('Anomalías')
  })
})
