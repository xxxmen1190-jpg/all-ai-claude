import { motion, AnimatePresence } from 'framer-motion'
import { Square, Sparkles } from 'lucide-react'
import { StepIndicator } from './StepIndicator'
import { MarkdownRenderer } from '../chat/MarkdownRenderer'
import type { AgentStep } from '../../../types'

interface Props {
  goal: string
  steps: AgentStep[]
  isRunning: boolean
  finalResult: string | null
  onCancel: () => void
  onRetryStep: (index: number) => void
}

/** Visualizes a running/completed Agent pipeline: plan, live step status, final output. */
export function AgentProgress({ goal, steps, isRunning, finalResult, onCancel, onRetryStep }: Props) {
  const doneCount = steps.filter((s) => s.status === 'done').length
  const hasError = steps.some((s) => s.status === 'error')

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card border border-border rounded-2xl p-4 max-w-2xl"
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Sparkles size={15} className="text-primary" />
          <span className="text-sm font-semibold">Agent: {goal}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-muted-foreground">
            {doneCount}/{steps.length}
          </span>
          {isRunning && (
            <button
              onClick={onCancel}
              className="flex items-center gap-1 text-[11px] bg-destructive/10 text-destructive rounded-md px-2 py-1 hover:bg-destructive/20"
            >
              <Square size={10} fill="currentColor" /> בטל
            </button>
          )}
        </div>
      </div>

      <div className="space-y-1.5">
        <AnimatePresence>
          {steps.map((step, i) => (
            <StepIndicator
              key={step.id}
              step={step}
              index={i}
              onRetry={() => onRetryStep(i)}
              canRetry={!isRunning}
            />
          ))}
        </AnimatePresence>
      </div>

      {finalResult && !hasError && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-3 pt-3 border-t border-border"
        >
          <p className="text-[11px] text-muted-foreground mb-1.5 font-semibold">✅ תוצאה סופית:</p>
          <div className="text-sm">
            <MarkdownRenderer content={finalResult} />
          </div>
        </motion.div>
      )}
    </motion.div>
  )
}
