import type { Tool, ToolContext } from './ToolRegistry'
import type { ToolResult } from '../../types'
import type { AIService } from '../AIService'

/**
 * Uses Perplexity (via AIService manual routing) to perform a live web search.
 * If Perplexity has no API key, AIService's router will fall back automatically.
 */
export function createWebSearchTool(aiService: AIService): Tool {
  return {
    name: 'web_search',
    label: '🔍 חיפוש אינטרנט',
    description: 'מחפש מידע עדכני באינטרנט',
    async execute(input: string, ctx: ToolContext): Promise<ToolResult> {
      const result = await aiService.complete({
        text: input,
        history: [],
        systemPrompt: 'You are a research assistant. Search and report factual, up-to-date information concisely.',
        model: 'perplexity',
        signal: ctx.signal,
        useCache: true,
      })
      return { tool: 'web_search', success: true, data: result.content }
    },
  }
}
