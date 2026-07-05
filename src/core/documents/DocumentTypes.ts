export type DocumentCategory = 'text' | 'spreadsheet' | 'image' | 'audio' | 'video'

export const MIME_TO_CATEGORY: Record<string, DocumentCategory> = {
  'application/pdf': 'text',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'text',
  'text/plain': 'text',
  'text/markdown': 'text',
  'text/csv': 'spreadsheet',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'spreadsheet',
  'application/vnd.ms-excel': 'spreadsheet',
  'image/jpeg': 'image',
  'image/png': 'image',
  'image/gif': 'image',
  'image/webp': 'image',
  'audio/mpeg': 'audio',
  'audio/wav': 'audio',
  'audio/ogg': 'audio',
  'video/mp4': 'video',
  'video/webm': 'video',
}

export const ACCEPTED_EXTENSIONS =
  '.pdf,.docx,.txt,.md,.csv,.xlsx,.xls,.jpg,.jpeg,.png,.gif,.webp,.mp3,.wav,.ogg,.mp4,.webm'

export interface ParsedDocument {
  id: string
  name: string
  type: string
  category: DocumentCategory
  size: number
  text: string           // extracted text (empty for audio/video)
  preview?: string       // base64 data URL for images
  chunks: TextChunk[]
  uploadedAt: number
}

export interface TextChunk {
  id: string
  text: string
  index: number
  documentId: string
  documentName: string
}
