import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Eye, Trash2, FileText, Image, Music, Video, Table2, Loader2, BookOpen } from 'lucide-react'
import { useDocumentStore } from '../../store/documentStore'
import { useDocuments } from '../../hooks/useDocuments'
import { FileDropZone } from './FileDropZone'
import { FilePreview } from './FilePreview'
import type { ParsedDocument } from '../../../core/documents/DocumentTypes'

const CATEGORY_ICON = {
  text: FileText,
  spreadsheet: Table2,
  image: Image,
  audio: Music,
  video: Video,
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

interface Props {
  open: boolean
  onClose: () => void
}

export function FileManager({ open, onClose }: Props) {
  const { documents, ragMode, setRagMode } = useDocumentStore()
  const { uploadFiles, removeDoc, runOCR, clearDocs, uploading, ocrInProgress, indexedCount } = useDocuments()
  const [previewDoc, setPreviewDoc] = useState<ParsedDocument | null>(null)

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose} className="fixed inset-0 bg-black/50 z-50" />
          <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
            transition={{ type: 'tween', duration: 0.25 }}
            className="fixed inset-y-0 left-0 z-50 w-full sm:w-[400px] bg-card border-r border-border flex flex-col">

            <div className="flex items-center justify-between p-4 border-b border-border flex-shrink-0">
              <div>
                <h2 className="font-bold text-sm">📁 ניהול מסמכים</h2>
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  {documents.length} קבצים · {indexedCount} קטעים בסיס ידע
                </p>
              </div>
              <div className="flex items-center gap-2">
                {documents.length > 0 && (
                  <button onClick={clearDocs} className="text-[11px] text-destructive hover:underline">נקה הכל</button>
                )}
                <button onClick={onClose} className="p-1.5 hover:bg-secondary rounded-lg text-muted-foreground"><X size={15} /></button>
              </div>
            </div>

            {/* RAG toggle */}
            <div className="px-4 py-3 border-b border-border flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 text-sm font-medium">
                  <BookOpen size={14} />
                  <span>מצב Document Chat</span>
                </div>
                <p className="text-[10px] text-muted-foreground mt-0.5">שאלות מהצ'אט יחפשו במסמכים תחילה</p>
              </div>
              <button
                onClick={() => setRagMode(!ragMode)}
                className={`w-10 h-5 rounded-full transition-colors relative ${ragMode ? 'bg-primary' : 'bg-secondary border border-border'}`}
              >
                <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${ragMode ? 'right-0.5' : 'left-0.5'}`} />
              </button>
            </div>

            {/* Upload zone */}
            <div className="px-4 pt-4">
              <FileDropZone onFiles={uploadFiles} uploading={uploading} />
            </div>

            {/* Document list */}
            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
              {documents.length === 0 && (
                <p className="text-xs text-muted-foreground text-center mt-6">אין מסמכים. העלה קובץ למעלה.</p>
              )}
              <AnimatePresence>
                {documents.map((doc) => {
                  const Icon = CATEGORY_ICON[doc.category] ?? FileText
                  const isOcr = ocrInProgress.has(doc.id)
                  return (
                    <motion.div key={doc.id}
                      initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: -20 }}
                      className="flex items-center gap-3 bg-secondary rounded-lg p-2.5 border border-border"
                    >
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                        {isOcr ? <Loader2 size={14} className="animate-spin text-primary" /> : <Icon size={14} className="text-primary" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-medium truncate">{doc.name}</div>
                        <div className="text-[10px] text-muted-foreground">
                          {formatBytes(doc.size)}
                          {doc.chunks.length > 0 && ` · ${doc.chunks.length} קטעים`}
                          {isOcr && ' · OCR בתהליך...'}
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        {doc.category === 'image' && !isOcr && doc.text.length === 0 && (
                          <button onClick={() => runOCR(doc)} className="p-1.5 hover:bg-muted rounded-md text-muted-foreground hover:text-foreground text-[10px]" title="הפעל OCR">
                            OCR
                          </button>
                        )}
                        <button onClick={() => setPreviewDoc(doc)} className="p-1.5 hover:bg-muted rounded-md text-muted-foreground hover:text-foreground" title="תצוגה מקדימה">
                          <Eye size={13} />
                        </button>
                        <button onClick={() => removeDoc(doc.id)} className="p-1.5 hover:bg-destructive/10 hover:text-destructive rounded-md text-muted-foreground" title="הסר">
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </motion.div>
                  )
                })}
              </AnimatePresence>
            </div>
          </motion.div>

          <FilePreview document={previewDoc} onClose={() => setPreviewDoc(null)} />
        </>
      )}
    </AnimatePresence>
  )
}
