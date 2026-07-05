import type { Tool, ToolContext } from './ToolRegistry'
import type { ToolResult } from '../../types'
import type { AIService } from '../AIService'

export function createSummarizeTool(aiService: AIService): Tool {
  return {
    name: 'summarize',
    label: '📝 סיכום',
    description: 'מסכם טקסט ארוך לתמצית קצרה וברורה',
    async execute(input: string, ctx: ToolContext): Promise<ToolResult> {
      const result = await aiService.complete({
        text: `Summarize the following content concisely, preserving key facts:\n\n${input}`,
        history: [],
        systemPrompt: 'You are a precise summarization assistant. Answer in the language of the input text.',
        model: 'claude',
        signal: ctx.signal,
        useCache: true,
      })
      return { tool: 'summarize', success: true, data: result.content }
    },
  }
}
