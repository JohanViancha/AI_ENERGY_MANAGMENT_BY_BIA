import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { ErrorState } from '@/components/shared/error-state'

describe('ErrorState', () => {
  it('muestra el título y el mensaje', () => {
    render(<ErrorState title="Falló la lista" message="El backend no responde" onRetry={vi.fn()} />)

    expect(screen.getByRole('alert')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Falló la lista' })).toBeInTheDocument()
    expect(screen.getByText('El backend no responde')).toBeInTheDocument()
  })

  it('usa textos por defecto cuando no se pasan', () => {
    render(<ErrorState onRetry={vi.fn()} />)

    expect(
      screen.getByRole('heading', { name: 'No se pudieron cargar los datos' }),
    ).toBeInTheDocument()
  })

  it('llama a onRetry al pulsar "Reintentar"', async () => {
    const onRetry = vi.fn()
    render(<ErrorState onRetry={onRetry} />)

    await userEvent.click(screen.getByRole('button', { name: 'Reintentar' }))

    expect(onRetry).toHaveBeenCalledTimes(1)
  })
})
