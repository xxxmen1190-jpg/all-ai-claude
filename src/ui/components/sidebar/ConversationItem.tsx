import { useState, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Pencil, Trash2, Check, X } from 'lucide-react'
import { cn, formatTime } from '../../../lib/utils'
import type { Conversation } from '../../../types'

interface Props {
  conversation: Conversation
  isActive: boolean
  onSelect: () => void
  onRename: (title: string) => void
  onDelete: () => void
}

export function ConversationItem({ conversation, isActive, onSelect, onRename, onDelete }: Props) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(conversation.title)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (editing) inputRef.current?.focus()
  }, [editing])

  function commitRename() {
    const trimmed = draft.trim()
    if (trimmed) onRename(trimmed)
    setEditing(false)
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.15 }}
      onClick={!editing ? onSelect : undefined}
      className={cn(
        'group relative flex items-center gap-2 rounded-lg px-2.5 py-2 cursor-pointer text-sm transition-colors',
        isActive ? 'bg-primary/15 text-primary border border-primary/30' : 'text-muted-foreground hover:bg-secondary border border-transparent'
      )}
    >
      <span className="text-base flex-shrink-0">💬</span>

      {editing ? (
        <div className="flex-1 flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
          <input
            ref={inputRef}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') commitRename()
              if (e.key === 'Escape') setEditing(false)
            }}
            className="flex-1 bg-background border border-border rounded px-1.5 py-0.5 text-xs outline-none"
          />
          <button onClick={commitRename} className="p-1 hover:text-primary"><Check size={12} /></button>
          <button onClick={() => setEditing(false)} className="p-1 hover:text-destructive"><X size={12} /></button>
        </div>
      ) : (
        <>
          <div className="flex-1 min-w-0">
            <div className="truncate">{conversation.title}</div>
            <div className="text-[10px] text-muted-foreground/70">{formatTime(conversation.updatedAt)}</div>
          </div>

          <div className="hidden group-hover:flex items-center gap-0.5" onClick={(e) => e.stopPropagation()}>
            {confirmDelete ? (
              <>
                <button onClick={onDelete} className="p-1 text-destructive hover:bg-destructive/10 rounded"><Check size={12} /></button>
                <button onClick={() => setConfirmDelete(false)} className="p-1 hover:bg-muted rounded"><X size={12} /></button>
              </>
            ) : (
              <>
                <button onClick={() => { setDraft(conversation.title); setEditing(true) }} className="p-1 hover:bg-muted rounded">
                  <Pencil size={12} />
                </button>
                <button onClick={() => setConfirmDelete(true)} className="p-1 hover:bg-destructive/10 hover:text-destructive rounded">
                  <Trash2 size={12} />
                </button>
              </>
            )}
          </div>
        </>
      )}
    </motion.div>
  )
}
