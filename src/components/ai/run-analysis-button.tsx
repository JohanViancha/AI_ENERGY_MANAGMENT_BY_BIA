import { Loader2, Sparkles } from 'lucide-react'

import { Button } from '@/components/ui/button'

export interface RunAnalysisButtonProps {
  isRunning: boolean
  onRun: () => void
}

/** Lanza el análisis; queda deshabilitado mientras hay una corrida en curso. */
export function RunAnalysisButton({ isRunning, onRun }: RunAnalysisButtonProps) {
  return (
    <Button onClick={onRun} disabled={isRunning} aria-busy={isRunning}>
      {isRunning ? (
        <Loader2 className="animate-spin" aria-hidden="true" />
      ) : (
        <Sparkles aria-hidden="true" />
      )}
      Run AI Analysis
    </Button>
  )
}
