import { motion } from 'framer-motion'
import { Check, X, Loader2, Circle, RotateCcw } from 'lucide-react'
import { cn } from '../../../lib/utils'
import type { AgentStep } from '../../../types'

interface Props {
  step: AgentStep
  index: number
  onRetry: () => void
  canRetry: boolean
}

const STATUS_STYLES = {
  pending: { icon: Circle, color: 'text-muted-foreground', bg: 'bg-secondary' },
  running: { icon: Loader2, color: 'text-primary', bg: 'bg-primary/10' },
  done: { icon: Check, color: 'text-green-500', bg: 'bg-green-500/10' },
  error: { icon: X, color: 'text-destructive', bg: 'bg-destructive/10' },
} as const

export function StepIndicator({ step, index, onRetry, canRetry }: Props) {
  const style = STATUS_STYLES[step.status]
  const Icon = style.icon

  return (
    <motion.div
      initial={{ opacity: 0, x: 8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
      className={cn('flex items-start gap-3 rounded-lg p-2.5 border border-border', style.bg)}
    >
      <div className={cn('mt-0.5 flex-shrink-0', style.color)}>
        <Icon size={16} className={step.status === 'running' ? 'animate-spin' : ''} />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-semibold">{step.label}</span>
          {step.status === 'error' && canRetry && (
            <button
              onClick={onRetry}
              className="flex items-center gap-1 text-[10px] text-primary hover:underline flex-shrink-0"
            >
              <RotateCcw size={10} /> נסה שוב
            </button>
          )}
        </div>

        {step.status === 'done' && step.result && (
          <p className="text-[11px] text-muted-foreground mt-1 line-clamp-2">{step.result}</p>
        )}
        {step.status === 'error' && step.result && (
          <p className="text-[11px] text-destructive mt-1">{step.result}</p>
        )}
      </div>
    </motion.div>
  )
}
