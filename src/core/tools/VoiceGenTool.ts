import type { Tool, ToolContext } from './ToolRegistry'
import type { ToolResult } from '../../types'
import type { MediaService } from '../MediaService'

export function createVoiceGenTool(mediaService: MediaService): Tool {
  return {
    name: 'voice_gen',
    label: '🎙️ יצירת קול',
    description: 'הופך טקסט לקובץ קולי',
    async execute(input: string, ctx: ToolContext): Promise<ToolResult> {
      const result = await mediaService.generateVoice(input, ctx.signal)
      return { tool: 'voice_gen', success: true, data: { audioUrl: result.audioUrl } }
    },
  }
}
