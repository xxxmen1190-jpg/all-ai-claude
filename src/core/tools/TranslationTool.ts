import type { Tool, ToolContext } from './ToolRegistry'
import type { ToolResult } from '../../types'
import type { AIService } from '../AIService'

export function createTranslationTool(aiService: AIService): Tool {
  return {
    name: 'translate',
    label: '🌍 תרגום',
    description: 'מתרגם טקסט בין שפות',
    async execute(input: string, ctx: ToolContext): Promise<ToolResult> {
      const result = await aiService.complete({
        text: `Translate the following text. If no target language is specified, translate to English if the source is Hebrew, or to Hebrew if the source is English:\n\n${input}`,
        history: [],
        systemPrompt: 'You are a professional translator. Return only the translated text, nothing else.',
        model: 'gpt',
        signal: ctx.signal,
        useCache: true,
      })
      return { tool: 'translate', success: true, data: result.content }
    },
  }
}
