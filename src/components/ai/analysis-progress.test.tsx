import { render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { AnalysisProgress } from '@/components/ai/analysis-progress'
import { ANALYSIS_PHASES } from '@/lib/analysis-phases'
import type { Analysis } from '@/types/analysis'

function buildAnalysis(overrides: Partial<Analysis> = {}): Analysis {
  return {
    id: 'an-1',
    startedAt: '2026-09-29T10:00:00Z',
    finishedAt: null,
    status: 'RUNNING',
    errorCode: null,
    errorMessage: null,
    triggeredBy: 'MANUAL',
    metersAnalyzed: [],
    progress: { phase: 'DETECTION', pct: 40 },
    anomaliesCount: 0,
    highPriorityCount: 0,
    ...overrides,
  }
}

const STATES = ['Hecha', 'En curso', 'Fallida', 'Pendiente']

function phaseStates() {
  return screen
    .getAllByRole('listitem')
    .map((item) => STATES.find((state) => within(item).queryByText(state)) ?? null)
}

describe('AnalysisProgress', () => {
  it('renders the 7 phases in order', () => {
    render(<AnalysisProgress analysis={buildAnalysis()} />)

    const items = screen.getAllByRole('listitem')
    expect(items).toHaveLength(7)
    ANALYSIS_PHASES.forEach(({ label }, index) => expect(items[index]).toHaveTextContent(label))
  })

  it('reflects progress.pct in the progress bar', () => {
    render(<AnalysisProgress analysis={buildAnalysis()} />)

    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '40')
  })

  it('marks previous phases done, the current one in progress and the rest pending', () => {
    render(<AnalysisProgress analysis={buildAnalysis()} />)

    expect(phaseStates()).toEqual([
      'Hecha',
      'Hecha',
      'En curso',
      'Pendiente',
      'Pendiente',
      'Pendiente',
      'Pendiente',
    ])
    expect(screen.getAllByRole('listitem')[2]).toHaveAttribute('aria-current', 'step')
  })

  it('marks all 7 phases done and 100% when COMPLETED', () => {
    render(
      <AnalysisProgress
        analysis={buildAnalysis({
          status: 'COMPLETED',
          progress: { phase: 'RECOMMENDATION', pct: 100 },
        })}
      />,
    )

    expect(phaseStates()).toEqual(Array(7).fill('Hecha'))
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '100')
  })

  it('shows errorMessage and marks the failed phase when FAILED', () => {
    render(
      <AnalysisProgress
        analysis={buildAnalysis({ status: 'FAILED', errorMessage: 'Fallo de detección' })}
      />,
    )

    expect(screen.getByRole('alert')).toHaveTextContent('Fallo de detección')
    expect(phaseStates()[2]).toBe('Fallida')
  })

  it('leaves every phase pending and keeps pct for an unknown phase', () => {
    render(
      <AnalysisProgress
        analysis={buildAnalysis({ progress: { phase: 'OTRA' as never, pct: 15 } })}
      />,
    )

    expect(phaseStates()).toEqual(Array(7).fill('Pendiente'))
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '15')
  })

  it('shows 0% with all phases pending while waiting for the first state', () => {
    render(<AnalysisProgress analysis={null} />)

    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '0')
    expect(phaseStates()).toEqual(Array(7).fill('Pendiente'))
  })

  it('shows the polling indicator only in polling mode', () => {
    const { rerender } = render(
      <AnalysisProgress analysis={buildAnalysis()} transport="firestore" />,
    )
    expect(screen.queryByText('Modo polling')).not.toBeInTheDocument()

    rerender(<AnalysisProgress analysis={buildAnalysis()} transport="polling" />)
    expect(screen.getByText('Modo polling')).toBeInTheDocument()
  })
})
