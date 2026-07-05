import { useRef, useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import { AgentRunner } from '../../core/agents/AgentRunner'
import { AIService } from '../../core/AIService'
import { MediaService } from '../../core/MediaService'
import { registerTools } from '../../core/tools/registerTools'
import { useSettingsStore } from '../store/settingsStore'
import type { AgentStep } from '../../types'

export interface AgentRunState {
  isRunning: boolean
  steps: AgentStep[]
  goal: string
  finalResult: string | null
  error: string | null
}

const INITIAL_STATE: AgentRunState = { isRunning: false, steps: [], goal: '', finalResult: null, error: null }

/**
 * Owns one AgentRunner instance (rebuilt whenever API keys change) and
 * exposes start/cancel/retryStep to the UI, mirroring the streaming
 * hook pattern from Stage 2/3.
 */
export function useAgent() {
  const apiKeys = useSettingsStore((s) => s.apiKeys)
  const [state, setState] = useState<AgentRunState>(INITIAL_STATE)
  const runnerRef = useRef<AgentRunner | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  if (!runnerRef.current) {
    const aiService = new AIService(apiKeys)
    const mediaService = new MediaService(apiKeys)
    registerTools(aiService, mediaService)
    runnerRef.current = new AgentRunner(aiService)
  }

  useEffect(() => {
    const aiService = new AIService(apiKeys)
    const mediaService = new MediaService(apiKeys)
    registerTools(aiService, mediaService)
    runnerRef.current = new AgentRunner(aiService)
  }, [apiKeys])

  function start(goal: string) {
    const runner = runnerRef.current!
    const steps = runner.planFor(goal)
    abortRef.current = new AbortController()
    setState({ isRunning: true, steps, goal, finalResult: null, error: null })

    runner.run(
      goal,
      steps,
      {
        onPlanReady: (planSteps) => setState((s) => ({ ...s, steps: planSteps })),
        onStepUpdate: (step) =>
          setState((s) => ({ ...s, steps: s.steps.map((st) => (st.id === step.id ? step : st)) })),
        onComplete: (finalResult, finalSteps) =>
          setState((s) => ({ ...s, isRunning: false, steps: finalSteps, finalResult })),
        onCancelled: (finalSteps) => {
          setState((s) => ({ ...s, isRunning: false, steps: finalSteps }))
          toast('הסוכן בוטל', { icon: '⏹' })
        },
        onError: (error, finalSteps) => {
          setState((s) => ({ ...s, isRunning: false, steps: finalSteps, error: error.message }))
          toast.error(`הסוכן נכשל: ${error.message}`)
        },
      },
      abortRef.current.signal
    )
  }

  function cancel() {
    abortRef.current?.abort()
  }

  function retryStep(stepIndex: number) {
    const runner = runnerRef.current!
    abortRef.current = new AbortController()
    setState((s) => ({ ...s, isRunning: true, error: null }))

    runner.retryStep(
      state.goal,
      state.steps,
      stepIndex,
      {
        onPlanReady: () => {},
        onStepUpdate: (step) =>
          setState((s) => ({ ...s, steps: s.steps.map((st) => (st.id === step.id ? step : st)) })),
        onComplete: (finalResult, finalSteps) =>
          setState((s) => ({ ...s, isRunning: false, steps: finalSteps, finalResult })),
        onCancelled: (finalSteps) => setState((s) => ({ ...s, isRunning: false, steps: finalSteps })),
        onError: (error, finalSteps) => {
          setState((s) => ({ ...s, isRunning: false, steps: finalSteps, error: error.message }))
          toast.error(`ניסיון חוזר נכשל: ${error.message}`)
        },
      },
      abortRef.current.signal
    )
  }

  function reset() {
    setState(INITIAL_STATE)
  }

  return { ...state, start, cancel, retryStep, reset }
}
