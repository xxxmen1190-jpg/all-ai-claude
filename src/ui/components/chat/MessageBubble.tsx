import { useState, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Copy, Check, RefreshCw, Pencil, Pin, PinOff, X } from 'lucide-react'
import { cn } from '../../../lib/utils'
import { ModelBadge } from '../shared/ModelBadge'
import { useClipboard } from '../../hooks/useClipboard'
import { useUIStore } from '../../store/uiStore'
import { MarkdownRenderer } from './MarkdownRenderer'
import type { Message } from '../../../types'

interface Props {
  message: Message
  onRegenerate?: () => void
  onEdit?: (newContent: string) => void
}

export function MessageBubble({ message, onRegenerate, onEdit }: Props) {
  const { copy, copied } = useClipboard()
  const [hovered, setHovered] = useState(false)
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(message.content)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const { togglePin, isPinned } = useUIStore()
  const isUser = message.role === 'user'
  const pinned = isPinned(message.id)

  useEffect(() => {
    if (editing) {
      textareaRef.current?.focus()
      textareaRef.current?.setSelectionRange(draft.length, draft.length)
    }
  }, [editing]) // eslint-disable-line react-hooks/exhaustive-deps

  function commitEdit() {
    const trimmed = draft.trim()
    if (trimmed && trimmed !== message.content) onEdit?.(trimmed)
    setEditing(false)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={cn('flex gap-3', isUser ? 'flex-row-reverse' : 'flex-row')}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div
        className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-sm font-bold"
        style={{
          background: isUser
            ? 'linear-gradient(135deg, #2563EB, #7C3AED)'
            : 'linear-gradient(135deg, #D97706, #7C3AED)',
        }}
      >
        {isUser ? '👤' : '🤖'}
      </div>

      <div className={cn('max-w-[85%] sm:max-w-[78%] flex flex-col', isUser ? 'items-end' : 'items-start')}>
        {!isUser && message.providerKey && (
          <ModelBadge providerKey={message.providerKey} isFallback={message.isFallback} />
        )}

        {pinned && (
          <div className="flex items-center gap-1 text-[10px] text-primary mb-0.5">
            <Pin size={9} /> מוצמד
          </div>
        )}

        {editing ? (
          <div className="w-full min-w-[240px]">
            <textarea
              ref={textareaRef}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  commitEdit()
                }
                if (e.key === 'Escape') setEditing(false)
              }}
              rows={3}
              className="w-full bg-background border border-primary rounded-xl px-3 py-2 text-sm outline-none resize-none"
            />
            <div className="flex gap-2 mt-1 justify-end">
              <button
                onClick={() => setEditing(false)}
                className="text-xs px-2.5 py-1 rounded-md hover:bg-muted text-muted-foreground flex items-center gap-1"
              >
                <X size={11} /> ביטול
              </button>
              <button
                onClick={commitEdit}
                className="text-xs px-2.5 py-1 rounded-md bg-primary text-primary-foreground flex items-center gap-1"
              >
                <Check size={11} /> שלח
              </button>
            </div>
          </div>
        ) : (
          <>
            <div
              className={cn(
                'px-4 py-3 text-sm leading-relaxed',
                isUser
                  ? 'bg-primary/10 border border-primary/20 rounded-2xl rounded-tr-sm text-foreground'
                  : 'bg-card border border-border rounded-2xl rounded-tl-sm text-foreground'
              )}
            >
              {isUser ? (
                <p className="whitespace-pre-wrap break-words">{message.content}</p>
              ) : (
                <MarkdownRenderer content={message.content} />
              )}
            </div>

            {message.image && (
              <img src={message.image} alt="Generated" loading="lazy" className="mt-2 rounded-xl max-w-full border border-border" />
            )}
            {message.audio && <audio controls src={message.audio} className="mt-2 w-full" />}

            {hovered && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-1 mt-1">
                <button
                  onClick={() => copy(message.content)}
                  className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                  title="העתק"
                >
                  {copied ? <Check size={13} /> : <Copy size={13} />}
                </button>

                {isUser && onEdit && (
                  <button
                    onClick={() => { setDraft(message.content); setEditing(true) }}
                    className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                    title="ערוך"
                  >
                    <Pencil size={13} />
                  </button>
                )}

                {!isUser && onRegenerate && (
                  <button
                    onClick={onRegenerate}
                    className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                    title="צור מחדש"
                  >
                    <RefreshCw size={13} />
                  </button>
                )}

                <button
                  onClick={() => togglePin(message.id)}
                  className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                  title={pinned ? 'בטל הצמדה' : 'הצמד'}
                >
                  {pinned ? <PinOff size={13} /> : <Pin size={13} />}
                </button>
              </motion.div>
            )}
          </>
        )}
      </div>
    </motion.div>
  )
}
