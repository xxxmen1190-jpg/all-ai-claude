import type { Tool, ToolContext } from './ToolRegistry'
import type { ToolResult } from '../../types'
import type { MediaService } from '../MediaService'

export function createImageGenTool(mediaService: MediaService): Tool {
  return {
    name: 'image_gen',
    label: '🎨 יצירת תמונה',
    description: 'מייצר תמונה מתיאור טקסטואלי',
    async execute(input: string, ctx: ToolContext): Promise<ToolResult> {
      const result = await mediaService.generateImage(input, ctx.signal)
      return { tool: 'image_gen', success: true, data: { url: result.url } }
    },
  }
}
