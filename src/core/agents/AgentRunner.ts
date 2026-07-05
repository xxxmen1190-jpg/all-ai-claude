import type { AgentStep, AgentStepType, ProviderKey, ToolName } from '../../types'
import type { AIService } from '../AIService'
import { ToolRegistry } from '../tools/ToolRegistry'
import { TaskPlanner } from './TaskPlanner'
import { Logger } from '../logging/Logger'

export interface AgentCallbacks {
  onPlanReady: (steps: AgentStep[]) => void
  onStepUpdate: (step: AgentStep) => void
  onComplete: (finalResult: string, steps: AgentStep[]) => void
  onCancelled: (steps: AgentStep[]) => void
  onError: (error: Error, steps: AgentStep[]) => void
}

/** Steps that delegate to a registered Tool. */
const STEP_TOOL_MAP: Partial<Record<AgentStepType, ToolName>> = {
  search: 'web_search',
  summarize: 'summarize',
  translate: 'translate',
  generate_image: 'image_gen',
  generate_voice: 'voice_gen',
}

/**
 * Executes a multi-step plan sequentially. Each step's output becomes
 * part of the working context for subsequent steps, so "Search → Analyze →
 * Summarize → Write" naturally builds on prior results.
 *
 * Steps mapped in STEP_TOOL_MAP run through ToolRegistry. 'analyze' and
 * 'write' are generic reasoning steps and run directly against AIService,
 * since they aren't tied to one external API.
 */
export class AgentRunner {
  private planner = new TaskPlanner()

  constructor(private aiService: AIService) {}

  planFor(goal: string): AgentStep[] {
    return this.planner.plan(goal)
  }

  async run(goal: string, initialSteps: AgentStep[], callbacks: AgentCallbacks, signal?: AbortSignal): Promise<void> {
    const steps = initialSteps.map((s) => ({ ...s }))
    callbacks.onPlanReady(steps)

    let workingContext = `Original task: ${goal}`

    for (let i = 0; i < steps.length; i++) {
      if (signal?.aborted) {
        this.markRemainingCancelled(steps, i)
        callbacks.onCancelled(steps)
        return
      }

      const stepResult = await this.runSingleStep(steps[i], workingContext, signal)
      Object.assign(steps[i], stepResult)
      callbacks.onStepUpdate(steps[i])

      if (steps[i].status === 'error') {
        callbacks.onError(new Error(steps[i].result || `Step "${steps[i].label}" failed`), steps)
        return
      }

      workingContext += `\n\n[${steps[i].label} result]:\n${steps[i].result}`
    }

    const finalStep = [...steps].reverse().find((s) => s.status === 'done')
    callbacks.onComplete(finalStep?.result ?? workingContext, steps)
  }

  /** Re-runs one failed step in place and continues the pipeline from there. */
  async retryStep(
    goal: string,
    steps: AgentStep[],
    stepIndex: number,
    callbacks: AgentCallbacks,
    signal?: AbortSignal
  ): Promise<void> {
    const updated = steps.map((s) => ({ ...s }))
    updated[stepIndex].status = 'pending'
    updated[stepIndex].result = undefined
    callbacks.onStepUpdate(updated[stepIndex])

    let workingContext = `Original task: ${goal}`
    for (let i = 0; i < stepIndex; i++) {
      workingContext += `\n\n[${updated[i].label} result]:\n${updated[i].result ?? ''}`
    }

    if (signal?.aborted) {
      this.markRemainingCancelled(updated, stepIndex)
      callbacks.onCancelled(updated)
      return
    }

    const stepResult = await this.runSingleStep(updated[stepIndex], workingContext, signal)
    Object.assign(updated[stepIndex], stepResult)
    const retriedStep = updated[stepIndex] as AgentStep
    callbacks.onStepUpdate(retriedStep)

    if (retriedStep.status === 'error') {
      callbacks.onError(new Error(retriedStep.result || 'Retry failed'), updated)
      return
    }

    workingContext += `\n\n[${updated[stepIndex].label} result]:\n${updated[stepIndex].result}`

    for (let i = stepIndex + 1; i < updated.length; i++) {
      if (signal?.aborted) {
        this.markRemainingCancelled(updated, i)
        callbacks.onCancelled(updated)
        return
      }
      const result = await this.runSingleStep(updated[i], workingContext, signal)
      Object.assign(updated[i], result)
      callbacks.onStepUpdate(updated[i])
      if (updated[i].status === 'error') {
        callbacks.onError(new Error(updated[i].result || `Step "${updated[i].label}" failed`), updated)
        return
      }
      workingContext += `\n\n[${updated[i].label} result]:\n${updated[i].result}`
    }

    const finalStep = [...updated].reverse().find((s) => s.status === 'done')
    callbacks.onComplete(finalStep?.result ?? workingContext, updated)
  }

  private async runSingleStep(
    step: AgentStep,
    workingContext: string,
    signal?: AbortSignal
  ): Promise<Partial<AgentStep>> {
    Logger.info('AgentRunner', `running step: ${step.type}`)
    const running: Partial<AgentStep> = { status: 'running' }
    Object.assign(step, running)

    try {
      const toolName = STEP_TOOL_MAP[step.type]

      if (toolName) {
        const toolResult = await ToolRegistry.execute(toolName, workingContext, { signal })
        if (!toolResult.success) {
          return { status: 'error', result: toolResult.error ?? 'Tool execution failed' }
        }
        const resultText =
          typeof toolResult.data === 'string'
            ? toolResult.data
            : JSON.stringify(toolResult.data)
        return { status: 'done', result: resultText }
      }

      // 'analyze' and 'write' — generic reasoning steps via AIService directly.
      const systemPrompt =
        step.type === 'analyze'
          ? 'You are an analytical assistant. Analyze the given context and extract key insights, in the language of the input.'
          : 'You are a skilled writer. Use the given context to write clear, well-structured final content, in the language of the input.'

      const completion = await this.aiService.complete({
        text: workingContext,
        history: [],
        systemPrompt,
        model: 'claude',
        signal,
        useCache: false,
      })

      return { status: 'done', result: completion.content, provider: completion.providerKey as ProviderKey }
    } catch (error) {
      if ((error as Error).name === 'AbortError') {
        return { status: 'error', result: 'בוטל' }
      }
      return { status: 'error', result: (error as Error).message }
    }
  }

  private markRemainingCancelled(steps: AgentStep[], fromIndex: number): void {
    for (let i = fromIndex; i < steps.length; i++) {
      if (steps[i].status === 'pending' || steps[i].status === 'running') {
        steps[i].status = 'error'
        steps[i].result = 'בוטל על ידי המשתמש'
      }
    }
  }
}
