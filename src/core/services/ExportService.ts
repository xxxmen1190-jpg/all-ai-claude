import type { Conversation } from '../../types'

export interface ExportPayload {
  version: 1
  exportedAt: number
  conversations: Conversation[]
}

/**
 * Export/import chat history as a single JSON file.
 * Version-stamped so future migrations can be handled gracefully.
 */
export const ExportService = {
  export(conversations: Conversation[]): void {
    const payload: ExportPayload = {
      version: 1,
      exportedAt: Date.now(),
      conversations,
    }
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `ai-orchestrator-export-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
  },

  async import(file: File): Promise<Conversation[]> {
    const text = await file.text()
    const payload: ExportPayload = JSON.parse(text)

    if (payload.version !== 1) {
      throw new Error(`גרסת קובץ לא נתמכת: ${payload.version}`)
    }
    if (!Array.isArray(payload.conversations)) {
      throw new Error('פורמט קובץ שגוי — conversations חסר')
    }
    return payload.conversations
  },
}
