import { useRef, useEffect, useState, memo } from 'react'
import { AnimatePresence } from 'framer-motion'
import { MessageBubble } from './MessageBubble'
import { TypingIndicator } from '../shared/TypingIndicator'
import { MessageSkeleton } from '../shared/MessageSkeleton'
import { PROVIDER_META } from '../../../lib/constants'
import type { Message } from '../../../types'

interface Props {
  messages: Message[]
  isStreaming: boolean
  routedProviderKey?: string
  onRegenerate: (messageId: string) => void
  onEdit: (messageId: string, content: string) => void
  onSuggestionClick: (text: string) => void
}

const SUGGESTIONS = [
  '✨ חקור ותכתוב מאמר על Quantum AI',
  '💻 כתוב פונקציה TypeScript למיון עצים',
  '🔍 חפש מה חדש בעולם ה-AI השבוע',
  '📝 עזור לי לנסח מייל מקצועי',
]

export const ChatWindow = memo(function ChatWindow({
  messages, isStreaming, routedProviderKey,
  onRegenerate, onEdit, onSuggestionClick,
}: Props) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const [autoScroll, setAutoScroll] = useState(true)
  const [showScrollBtn, setShowScrollBtn] = useState(false)

  useEffect(() => {
    if (autoScroll) bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isStreaming, autoScroll])

  function handleScroll() {
    const el = scrollRef.current
    if (!el) return
    const distFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight
    setAutoScroll(distFromBottom < 80)
    setShowScrollBtn(distFromBottom > 200)
  }

  const lastMsg = messages[messages.length - 1]
  const showTyping = isStreaming && lastMsg?.role === 'assistant' && !lastMsg.content
  const providerMeta = routedProviderKey
    ? PROVIDER_META[routedProviderKey as keyof typeof PROVIDER_META]
    : null

  return (
    <div
      ref={scrollRef}
      onScroll={handleScroll}
      className="flex-1 overflow-y-auto px-3 sm:px-6 py-4"
      role="log"
      aria-label="היסטוריית שיחה"
      aria-live="polite"
      aria-relevant="additions"
    >
      <div className="max-w-3xl mx-auto space-y-5">
        {/* Welcome / suggestions */}
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center">
            <div className="text-5xl" aria-hidden="true">🤖</div>
            <div>
              <h1 className="text-lg font-bold">AI Orchestrator</h1>
              <p className="text-sm text-muted-foreground mt-1">
                בחר מודל או השאר Auto — ואני אבחר את הספק הטוב ביותר
              </p>
            </div>
            <div
              className="flex flex-wrap justify-center gap-2 mt-2"
              role="group"
              aria-label="הצעות להתחלה"
            >
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => onSuggestionClick(s.replace(/^[^\s]+ /, ''))}
                  className="text-xs bg-secondary border border-border rounded-full px-3.5 py-2 hover:bg-muted transition-colors"
                  aria-label={`שלח: ${s}`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        <AnimatePresence initial={false}>
          {messages.map((m) => {
            const isTypingMsg = showTyping && m.id === lastMsg.id
            if (isTypingMsg) {
              return (
                <div
                  key={m.id}
                  className="flex gap-3"
                  role="status"
                  aria-label="ה-AI מקליד..."
                >
                  <div
                    className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-sm"
                    aria-hidden="true"
                    style={{
                      background: providerMeta
                        ? `linear-gradient(135deg,${providerMeta.color}88,${providerMeta.color})`
                        : 'linear-gradient(135deg,#D97706,#7C3AED)',
                    }}
                  >
                    {providerMeta?.emoji ?? '🤖'}
                  </div>
                  <div className="bg-card border border-border rounded-2xl rounded-tl-sm px-4 py-3">
                    <TypingIndicator color={providerMeta?.color} />
                  </div>
                </div>
              )
            }

            return (
              <MessageBubble
                key={m.id}
                message={m}
                onRegenerate={
                  m.role === 'assistant' && !isStreaming ? () => onRegenerate(m.id) : undefined
                }
                onEdit={
                  m.role === 'user' && !isStreaming ? (c) => onEdit(m.id, c) : undefined
                }
              />
            )
          })}
        </AnimatePresence>

        {/* Streaming skeleton while waiting for first token */}
        {isStreaming && messages[messages.length - 1]?.role === 'user' && (
          <MessageSkeleton />
        )}

        <div ref={bottomRef} />
      </div>

      {/* Scroll-to-bottom button */}
      {showScrollBtn && (
        <button
          onClick={() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); setAutoScroll(true) }}
          aria-label="גלול לתחתית"
          className="fixed bottom-24 right-4 bg-card border border-border shadow-lg rounded-full p-2.5 text-sm hover:bg-secondary transition-colors z-10"
        >
          ↓
        </button>
      )}
    </div>
  )
})
