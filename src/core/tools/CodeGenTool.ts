import type { Tool, ToolContext } from './ToolRegistry'
import type { ToolResult } from '../../types'
import type { AIService } from '../AIService'

export function createCodeGenTool(aiService: AIService): Tool {
  return {
    name: 'code_gen',
    label: '💻 כתיבת קוד',
    description: 'כותב או מתקן קוד לפי בקשה',
    async execute(input: string, ctx: ToolContext): Promise<ToolResult> {
      const result = await aiService.complete({
        text: input,
        history: [],
        systemPrompt: 'You are an expert software engineer. Write clean, correct, production-ready code with brief explanations.',
        model: 'deepseek',
        signal: ctx.signal,
        useCache: false,
      })
      return { tool: 'code_gen', success: true, data: result.content }
    },
  }
}
