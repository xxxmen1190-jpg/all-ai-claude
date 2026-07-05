import { useRef, useEffect, useCallback, useState } from 'react'
import toast from 'react-hot-toast'
import { parseDocument } from '../../core/documents/DocumentParser'
import { extractTextFromImage } from '../../core/documents/ClaudeOCR'
import { RAGService } from '../../core/documents/RAGService'
import { AIService } from '../../core/AIService'
import { useDocumentStore } from '../store/documentStore'
import { useSettingsStore } from '../store/settingsStore'
import { generateId } from '../../lib/utils'
import type { ParsedDocument } from '../../core/documents/DocumentTypes'

const CHUNK_SIZE = 500
const CHUNK_OVERLAP = 50

function buildChunks(text: string, documentId: string, documentName: string) {
  const words = text.split(/\s+/).filter(Boolean)
  if (!words.length) return []
  const chunks = []
  let start = 0
  let index = 0
  while (start < words.length) {
    chunks.push({
      id: generateId(),
      text: words.slice(start, start + CHUNK_SIZE).join(' '),
      index: index++,
      documentId,
      documentName,
    })
    start += CHUNK_SIZE - CHUNK_OVERLAP
  }
  return chunks
}

export function useDocuments() {
  const apiKeys = useSettingsStore((s) => s.apiKeys)
  const {
    documents, ragMode, activeDocumentId,
    addDocument, removeDocument, updateDocument,
    setRagMode, setActiveDocument, clearAll,
  } = useDocumentStore()

  const [uploading, setUploading] = useState(false)
  const [ocrInProgress, setOcrInProgress] = useState<Set<string>>(new Set())

  const ragRef = useRef<RAGService | null>(null)
  // Track blob URLs created for audio/video so we can revoke them
  const blobUrls = useRef<string[]>([])

  if (!ragRef.current) {
    ragRef.current = new RAGService(new AIService(apiKeys))
  }

  useEffect(() => {
    ragRef.current = new RAGService(new AIService(apiKeys))
    for (const doc of documents) {
      if (doc.chunks.length > 0) ragRef.current.addDocument(doc)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiKeys])

  // Cleanup: revoke all tracked blob URLs on unmount
  useEffect(() => {
    return () => {
      for (const url of blobUrls.current) URL.revokeObjectURL(url)
    }
  }, [])

  const uploadFiles = useCallback(async (files: FileList | File[]) => {
    setUploading(true)
    let successCount = 0
    for (const file of Array.from(files)) {
      try {
        toast.loading(`מעבד: ${file.name}`, { id: file.name })
        const parsed = await parseDocument(file)

        // Track any blob URLs created for audio/video preview
        if (parsed.preview?.startsWith('blob:')) blobUrls.current.push(parsed.preview)

        addDocument(parsed)
        if (parsed.chunks.length > 0) ragRef.current?.addDocument(parsed)
        toast.success(`✓ ${file.name}`, { id: file.name })
        successCount++

        if (parsed.category === 'image' && parsed.preview) runOCR(parsed)
      } catch (err) {
        toast.error(`שגיאה ב-${file.name}: ${(err as Error).message}`, { id: file.name })
      }
    }
    setUploading(false)
    if (successCount > 1) toast.success(`${successCount} קבצים הועלו`)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [addDocument])

  async function runOCR(doc: ParsedDocument) {
    if (!doc.preview) return
    setOcrInProgress((s) => new Set([...s, doc.id]))
    try {
      const text = await extractTextFromImage(doc.preview)
      const chunks = buildChunks(text, doc.id, doc.name)
      updateDocument(doc.id, { text, chunks })
      ragRef.current?.removeDocument(doc.id)
      ragRef.current?.addDocument({ ...doc, text, chunks })
      toast.success(`OCR הושלם: ${doc.name}`)
    } catch (err) {
      toast.error(`OCR נכשל: ${(err as Error).message}`)
    } finally {
      setOcrInProgress((s) => { const n = new Set(s); n.delete(doc.id); return n })
    }
  }

  function removeDoc(id: string) {
    const doc = documents.find((d) => d.id === id)
    // Revoke blob URL if present
    if (doc?.preview?.startsWith('blob:')) {
      URL.revokeObjectURL(doc.preview)
      blobUrls.current = blobUrls.current.filter((u) => u !== doc.preview)
    }
    ragRef.current?.removeDocument(id)
    removeDocument(id)
    toast('קובץ הוסר')
  }

  function clearDocs() {
    // Revoke all blob URLs
    for (const url of blobUrls.current) URL.revokeObjectURL(url)
    blobUrls.current = []
    for (const doc of documents) ragRef.current?.removeDocument(doc.id)
    clearAll()
    toast('כל הקבצים הוסרו')
  }

  async function queryDocuments(question: string, signal?: AbortSignal) {
    if (!ragRef.current?.hasDocuments()) {
      throw new Error('אין מסמכים טעונים. העלה קבצים תחילה.')
    }
    return ragRef.current.query(question, signal)
  }

  return {
    documents,
    ragMode,
    activeDocumentId,
    uploading,
    ocrInProgress,
    uploadFiles,
    removeDoc,
    runOCR,
    clearDocs,
    setRagMode,
    setActiveDocument,
    queryDocuments,
    hasDocuments: documents.length > 0,
    indexedCount: ragRef.current?.indexSize() ?? 0,
  }
}
