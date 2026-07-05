import { useRef, useState, type DragEvent } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Upload } from 'lucide-react'
import { ACCEPTED_EXTENSIONS } from '../../../core/documents/DocumentTypes'

interface Props {
  onFiles: (files: FileList | File[]) => void
  uploading: boolean
}

export function FileDropZone({ onFiles, uploading }: Props) {
  const [dragging, setDragging] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  function handleDrop(e: DragEvent) {
    e.preventDefault()
    setDragging(false)
    if (e.dataTransfer.files.length) onFiles(e.dataTransfer.files)
  }

  function handleDragOver(e: DragEvent) {
    e.preventDefault()
    setDragging(true)
  }

  return (
    <div
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={() => setDragging(false)}
      onClick={() => inputRef.current?.click()}
      className="relative border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors"
      style={{ borderColor: dragging ? 'hsl(var(--primary))' : 'hsl(var(--border))' }}
    >
      <AnimatePresence>
        {dragging && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 rounded-xl"
            style={{ background: 'hsl(var(--primary)/0.08)' }}
          />
        )}
      </AnimatePresence>

      <input
        ref={inputRef}
        type="file"
        multiple
        accept={ACCEPTED_EXTENSIONS}
        className="hidden"
        onChange={(e) => { if (e.target.files) onFiles(e.target.files) }}
      />

      <Upload size={24} className="mx-auto mb-2 text-muted-foreground" />
      <p className="text-sm font-medium">{uploading ? 'מעבד קבצים...' : 'גרור קבצים לכאן או לחץ להעלאה'}</p>
      <p className="text-[11px] text-muted-foreground mt-1">PDF, DOCX, TXT, CSV, Excel, תמונות, אודיו, וידאו</p>
    </div>
  )
}
