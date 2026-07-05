import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'
import type { ParsedDocument } from '../../../core/documents/DocumentTypes'

interface Props {
  document: ParsedDocument | null
  onClose: () => void
}

export function FilePreview({ document: doc, onClose }: Props) {
  return (
    <AnimatePresence>
      {doc && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose} className="fixed inset-0 bg-black/60 z-50" />
          <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.96 }}
            className="fixed inset-4 sm:inset-16 z-50 bg-card border border-border rounded-2xl flex flex-col overflow-hidden">
            <div className="flex items-center justify-between p-3 border-b border-border flex-shrink-0">
              <h3 className="text-sm font-semibold truncate">{doc.name}</h3>
              <button onClick={onClose} className="p-1.5 hover:bg-secondary rounded-lg text-muted-foreground">
                <X size={15} />
              </button>
            </div>
            <div className="flex-1 overflow-auto p-4">
              {doc.category === 'image' && doc.preview && (
                <img src={doc.preview} alt={doc.name} className="max-w-full max-h-full mx-auto rounded-lg" />
              )}
              {doc.category === 'audio' && doc.preview && (
                <div className="flex flex-col items-center justify-center h-full gap-3">
                  <div className="text-5xl">🎵</div>
                  <p className="text-sm">{doc.name}</p>
                  <audio controls src={doc.preview} className="w-full max-w-md" />
                </div>
              )}
              {doc.category === 'video' && doc.preview && (
                <video controls src={doc.preview} className="max-w-full max-h-full mx-auto rounded-lg" />
              )}
              {(doc.category === 'text' || doc.category === 'spreadsheet') && (
                <pre className="text-xs font-mono whitespace-pre-wrap text-foreground">
                  {doc.text.slice(0, 10000)}
                  {doc.text.length > 10000 && '\n\n... (truncated for preview)'}
                </pre>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
