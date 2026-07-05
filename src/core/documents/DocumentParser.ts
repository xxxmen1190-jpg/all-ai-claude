import type { ParsedDocument, TextChunk, DocumentCategory } from './DocumentTypes'
import { MIME_TO_CATEGORY } from './DocumentTypes'
import { generateId } from '../../lib/utils'

const CHUNK_SIZE = 500        // words per chunk
const CHUNK_OVERLAP = 50      // words overlapping between chunks

function chunkText(text: string, documentId: string, documentName: string): TextChunk[] {
  const words = text.split(/\s+/).filter(Boolean)
  if (words.length === 0) return []
  const chunks: TextChunk[] = []
  let start = 0
  let index = 0
  while (start < words.length) {
    const slice = words.slice(start, start + CHUNK_SIZE).join(' ')
    chunks.push({ id: generateId(), text: slice, index: index++, documentId, documentName })
    start += CHUNK_SIZE - CHUNK_OVERLAP
  }
  return chunks
}

async function readAsArrayBuffer(file: File): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as ArrayBuffer)
    reader.onerror = () => reject(reader.error)
    reader.readAsArrayBuffer(file)
  })
}

async function readAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(file)
  })
}

async function readAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(reader.error)
    reader.readAsText(file, 'UTF-8')
  })
}

async function parsePDF(file: File): Promise<string> {
  const { getDocument, GlobalWorkerOptions } = await import('pdfjs-dist')
  GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.0.379/pdf.worker.min.js`
  const buffer = await readAsArrayBuffer(file)
  const pdf = await getDocument({ data: buffer }).promise
  const pages: string[] = []
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i)
    const content = await page.getTextContent()
    pages.push(content.items.map((item: unknown) => (item as { str?: string }).str ?? '').join(' '))
  }
  return pages.join('\n\n')
}

async function parseDOCX(file: File): Promise<string> {
  const mammoth = await import('mammoth')
  const buffer = await readAsArrayBuffer(file)
  const result = await mammoth.extractRawText({ arrayBuffer: buffer })
  return result.value
}

async function parseCSV(file: File): Promise<string> {
  const Papa = (await import('papaparse')).default
  const text = await readAsText(file)
  const result = Papa.parse<string[]>(text, { skipEmptyLines: true })
  return result.data.map((row: string[]) => row.join('\t')).join('\n')
}

async function parseExcel(file: File): Promise<string> {
  const XLSX = await import('xlsx')
  const buffer = await readAsArrayBuffer(file)
  const workbook = XLSX.read(buffer, { type: 'array' })
  const lines: string[] = []
  for (const sheetName of workbook.SheetNames) {
    lines.push(`[Sheet: ${sheetName}]`)
    const sheet = workbook.Sheets[sheetName]
    const csv = XLSX.utils.sheet_to_csv(sheet)
    lines.push(csv)
  }
  return lines.join('\n\n')
}

/**
 * Parses any supported file type into a unified ParsedDocument.
 * Images return an empty text string — OCR is handled separately via
 * ClaudeOCR, which sends the base64 to the Claude vision API.
 */
export async function parseDocument(file: File): Promise<ParsedDocument> {
  const id = generateId()
  const category: DocumentCategory = MIME_TO_CATEGORY[file.type] ?? 'text'
  let text = ''
  let preview: string | undefined

  if (category === 'image') {
    preview = await readAsDataURL(file)
    // text left empty — OCR fills it in via ClaudeOCR after parsing
  } else if (category === 'audio' || category === 'video') {
    preview = await readAsDataURL(file)
    text = ''
  } else if (file.type === 'application/pdf') {
    text = await parsePDF(file)
  } else if (file.type.includes('wordprocessingml')) {
    text = await parseDOCX(file)
  } else if (file.type === 'text/csv') {
    text = await parseCSV(file)
  } else if (file.type.includes('spreadsheetml') || file.type.includes('ms-excel')) {
    text = await parseExcel(file)
  } else {
    // txt, md, plain text
    text = await readAsText(file)
  }

  const chunks = chunkText(text, id, file.name)

  return {
    id,
    name: file.name,
    type: file.type,
    category,
    size: file.size,
    text,
    preview,
    chunks,
    uploadedAt: Date.now(),
  }
}
