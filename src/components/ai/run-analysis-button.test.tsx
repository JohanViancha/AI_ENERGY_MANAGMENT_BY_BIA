import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { RunAnalysisButton } from '@/components/ai/run-analysis-button'

describe('RunAnalysisButton', () => {
  it('calls onRun when clicked', async () => {
    const onRun = vi.fn()
    render(<RunAnalysisButton isRunning={false} onRun={onRun} />)

    await userEvent.click(screen.getByRole('button', { name: 'Run AI Analysis' }))

    expect(onRun).toHaveBeenCalledTimes(1)
  })

  it('is disabled and aria-busy while a run is in progress', async () => {
    const onRun = vi.fn()
    render(<RunAnalysisButton isRunning onRun={onRun} />)

    const button = screen.getByRole('button', { name: 'Run AI Analysis' })
    await userEvent.click(button)

    expect(button).toBeDisabled()
    expect(button).toHaveAttribute('aria-busy', 'true')
    expect(onRun).not.toHaveBeenCalled()
  })
})
