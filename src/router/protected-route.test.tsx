import { render, screen } from '@testing-library/react'
import type { User } from 'firebase/auth'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { ProtectedRoute } from '@/router/protected-route'

const useAuthMock = vi.fn()

vi.mock('@/hooks/use-auth', () => ({
  useAuth: () => useAuthMock(),
}))

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/login" element={<div>Pantalla de login</div>} />
        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<div>Contenido protegido</div>} />
        </Route>
      </Routes>
    </MemoryRouter>,
  )
}

describe('ProtectedRoute', () => {
  beforeEach(() => {
    useAuthMock.mockReset()
  })

  it('shows the loading indicator and does not redirect while isLoading is true', () => {
    useAuthMock.mockReturnValue({ user: null, isLoading: true })

    renderAt('/')

    expect(screen.getByRole('status', { name: 'Cargando' })).toBeInTheDocument()
    expect(screen.queryByText('Pantalla de login')).not.toBeInTheDocument()
    expect(screen.queryByText('Contenido protegido')).not.toBeInTheDocument()
  })

  it('redirects to /login when there is no user', () => {
    useAuthMock.mockReturnValue({ user: null, isLoading: false })

    renderAt('/')

    expect(screen.getByText('Pantalla de login')).toBeInTheDocument()
    expect(screen.queryByText('Contenido protegido')).not.toBeInTheDocument()
  })

  it('renders the nested route when there is a user', () => {
    useAuthMock.mockReturnValue({ user: { email: 'a@b.com' } as User, isLoading: false })

    renderAt('/')

    expect(screen.getByText('Contenido protegido')).toBeInTheDocument()
  })
})
