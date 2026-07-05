import { useRef, useState, type KeyboardEvent, useCallback } from 'react'
import { Send, Square } from 'lucide-react'
import { motion } from 'framer-motion'
import { TemplatesPicker } from './TemplatesPicker'

interface Props {
  onSend: (text: string) => void
  onStop: () => void
  isStreaming: boolean
  placeholder?: string
}

const MAX_HEIGHT_PX = 160

export function InputBar({ onSend, onStop, isStreaming, placeholder }: Props) {
  const [value, setValue] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const autoResize = useCallback(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, MAX_HEIGHT_PX)}px`
  }, [])

  function handleSend() {
    const trimmed = value.trim()
    if (!trimmed || isStreaming) return
    onSend(trimmed)
    setValue('')
    requestAnimationFrame(() => {
      if (textareaRef.current) textareaRef.current.style.height = 'auto'
    })
  }

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  function handleTemplateSelect(content: string) {
    setValue(content)
    textareaRef.current?.focus()
    requestAnimationFrame(autoResize)
  }

  return (
    <div
      className="border-t border-border bg-card flex-shrink-0"
      style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))' }}
    >
      <div className="flex gap-2 items-end max-w-3xl mx-auto px-3 pt-3">
        {/* Template picker */}
        <TemplatesPicker onSelect={handleTemplateSelect} />

        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => {
            setValue(e.target.value)
            autoResize()
          }}
          onKeyDown={handleKeyDown}
          placeholder={placeholder ?? 'שאל כל דבר...'}
          rows={1}
          aria-label="הזן הודעה"
          aria-multiline="true"
          className="flex-1 bg-secondary border border-border rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-1 focus:ring-ring resize-none leading-relaxed"
          style={{ maxHeight: MAX_HEIGHT_PX }}
        />

        {isStreaming ? (
          <motion.button
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            onClick={onStop}
            aria-label="עצור יצירת תגובה"
            className="flex-shrink-0 bg-destructive text-destructive-foreground rounded-xl p-3 hover:opacity-90 transition-opacity"
          >
            <Square size={16} fill="currentColor" />
          </motion.button>
        ) : (
          <motion.button
            whileTap={{ scale: 0.92 }}
            onClick={handleSend}
            disabled={!value.trim()}
            aria-label="שלח הודעה"
            className="flex-shrink-0 bg-primary text-primary-foreground rounded-xl p-3 disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90 transition-opacity"
          >
            <Send size={16} />
          </motion.button>
        )}
      </div>
      <p className="text-[10px] text-muted-foreground text-center mt-1.5 pb-1 hidden sm:block">
        Enter לשליחה · Shift+Enter לשורה חדשה · Ctrl+K שיחה חדשה
      </p>
    </div>
  )
}
