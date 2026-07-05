import type { AgentStep, AgentStepType } from '../../types'
import { generateId } from '../../lib/utils'

interface PlanRule {
  type: AgentStepType
  label: string
  /** Decides whether this step should be included for the given goal text. */
  shouldInclude: (goal: string) => boolean
}

/**
 * Builds a step-by-step plan from a natural-language goal.
 * Keyword-driven and ordered, but fully data-driven — adding a new step
 * type to the pipeline means adding one rule here, nothing else changes.
 */
export class TaskPlanner {
  private rules: PlanRule[] = [
    { type: 'search', label: '🔍 חיפוש מידע', shouldInclude: (g) => /חפש|search|מידע|חדשות|research/i.test(g) },
    { type: 'analyze', label: '🧠 ניתוח', shouldInclude: (g) => /נתח|analyze|ניתוח|השווה|compare/i.test(g) },
    { type: 'summarize', label: '📝 סיכום', shouldInclude: (g) => /סכם|summarize|תמצית|summary/i.test(g) },
    { type: 'translate', label: '🌍 תרגום', shouldInclude: (g) => /תרגם|translate|בשפה/i.test(g) },
    { type: 'write', label: '✍️ כתיבה', shouldInclude: (g) => /כתוב|write|נסח|מאמר|פוסט|דוח|report/i.test(g) },
    { type: 'generate_image', label: '🎨 יצירת תמונה', shouldInclude: (g) => /צייר|תמונה|image|draw|איור/i.test(g) },
    { type: 'generate_voice', label: '🎙️ יצירת קול', shouldInclude: (g) => /קול|voice|הקרא|audio|tts/i.test(g) },
  ]

  /**
   * Builds a plan. If no rule matches (simple goal), falls back to a
   * minimal 2-step plan: analyze the request, then write the result —
   * this guarantees every agent run produces at least one real step.
   */
  plan(goal: string): AgentStep[] {
    const matched = this.rules.filter((r) => r.shouldInclude(goal))
    const chosen = matched.length > 0 ? matched : [this.rules[1], this.rules[4]] // analyze -> write

    return chosen.map(
      (rule): AgentStep => ({
        id: generateId(),
        type: rule.type,
        label: rule.label,
        status: 'pending',
      })
    )
  }
}
