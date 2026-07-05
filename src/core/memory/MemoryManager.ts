import type { Message } from '../../types'
import type { ChatMessage } from '../providers/BaseProvider'

/**
 * Builds bounded conversation context for providers.
 * Keeps the last N messages to control token usage and cost.
 */
export class MemoryManager {
  constructor(private maxMessages: number = 20) {}

  buildContext(history: Message[], systemPrompt: string, newUserMessage: string): ChatMessage[] {
    const recent = history.slice(-this.maxMessages).map(
      (m): ChatMessage => ({ role: m.role, content: m.content })
    )
    return [{ role: 'system', content: systemPrompt }, ...recent, { role: 'user', content: newUserMessage }]
  }
}
