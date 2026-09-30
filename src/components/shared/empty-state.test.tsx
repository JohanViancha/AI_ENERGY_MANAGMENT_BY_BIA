import { render, screen } from '@testing-library/react'
import { Inbox } from 'lucide-react'
import { describe, expect, it } from 'vitest'

import { EmptyState } from '@/components/shared/empty-state'

describe('EmptyState', () => {
  it('renders the icon, title and description', () => {
    const { container } = render(
      <EmptyState icon={Inbox} title="Sin datos" description="Aún no hay nada por mostrar" />,
    )

    expect(screen.getByRole('heading', { name: 'Sin datos' })).toBeInTheDocument()
    expect(screen.getByText('Aún no hay nada por mostrar')).toBeInTheDocument()
    expect(container.querySelector('svg')).toBeInTheDocument()
  })

  it('renders the action when provided', () => {
    render(<EmptyState icon={Inbox} title="Sin datos" action={<button>Crear</button>} />)

    expect(screen.getByRole('button', { name: 'Crear' })).toBeInTheDocument()
  })

  it('does not render the action block nor the description when omitted', () => {
    render(<EmptyState icon={Inbox} title="Sin datos" />)

    expect(screen.queryByTestId('empty-state-action')).not.toBeInTheDocument()
    expect(screen.queryByText('Aún no hay nada por mostrar')).not.toBeInTheDocument()
  })
})
