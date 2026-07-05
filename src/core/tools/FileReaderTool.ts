import type { Tool } from './ToolRegistry'
import type { ToolResult } from '../../types'

/**
 * Reads plain-text file content that was already extracted client-side
 * (the Agent step passes the raw text it read from an uploaded File object).
 * Full PDF/DOCX parsing is added in Stage 5 — this tool just normalizes
 * and validates already-extracted text so it can flow into other tools.
 */
export const FileReaderTool: Tool = {
  name: 'file_read',
  label: '📄 קריאת קובץ',
  description: 'מעבד טקסט שחולץ מקובץ שהועלה',
  async execute(input: string, _ctx?: unknown): Promise<ToolResult> {
    const trimmed = input.trim()
    if (!trimmed) {
      return { tool: 'file_read', success: false, error: 'הקובץ ריק או שלא ניתן היה לחלץ ממנו טקסט' }
    }
    return { tool: 'file_read', success: true, data: trimmed }
  },
}
