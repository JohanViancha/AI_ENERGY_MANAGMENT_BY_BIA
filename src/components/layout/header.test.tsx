import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { Header } from '@/components/layout/header'

const logoutMock = vi.fn()

vi.mock('@/hooks/use-auth', () => ({
  useAuth: () => ({ user: { email: 'ana@example.com' }, logout: logoutMock }),
}))

function renderHeader(onOpenMobileNav = vi.fn()) {
  render(
    <MemoryRouter initialEntries={['/meters']}>
      <Routes>
        <Route path="/login" element={<div>Pantalla de login</div>} />
        <Route path="/meters" element={<Header onOpenMobileNav={onOpenMobileNav} />} />
      </Routes>
    </MemoryRouter>,
  )
  return onOpenMobileNav
}

describe('Header', () => {
  beforeEach(() => {
    logoutMock.mockReset()
    logoutMock.mockResolvedValue(undefined)
  })

  it('shows the user email', () => {
    renderHeader()

    expect(screen.getByText('ana@example.com')).toBeInTheDocument()
  })

  it('shows the breadcrumbs of the current route', () => {
    renderHeader()

    expect(screen.getByRole('link', { name: 'Dashboard' })).toBeInTheDocument()
    expect(screen.getByText('Medidores')).toHaveAttribute('aria-current', 'page')
  })

  it('calls logout and navigates to /login when Logout is pressed', async () => {
    renderHeader()

    await userEvent.click(screen.getByRole('button', { name: 'Logout' }))

    expect(logoutMock).toHaveBeenCalledTimes(1)
    expect(await screen.findByText('Pantalla de login')).toBeInTheDocument()
  })

  it('calls onOpenMobileNav when the hamburger button is pressed', async () => {
    const onOpenMobileNav = renderHeader()

    await userEvent.click(screen.getByRole('button', { name: 'Abrir menú de navegación' }))

    expect(onOpenMobileNav).toHaveBeenCalledTimes(1)
  })
})
