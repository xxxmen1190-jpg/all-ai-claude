import { lazy, Suspense, useEffect, useState, useRef } from 'react'
import { memo } from 'react'
import toast from 'react-hot-toast'
import { useChat } from '../ui/hooks/useChat'
import { useAIService } from '../ui/hooks/useAIService'
import { useAgent } from '../ui/hooks/useAgent'
import { useDocuments } from '../ui/hooks/useDocuments'
import { useChatStore } from '../ui/store/chatStore'
import { ErrorBoundary } from '../ui/components/shared/ErrorBoundary'
import { ChatHeader } from '../ui/components/header/ChatHeader'
import { ChatWindow } from '../ui/components/chat/ChatWindow'
import { InputBar } from '../ui/components/chat/InputBar'
import { Sidebar } from '../ui/components/sidebar/Sidebar'

// Heavy panels — lazily loaded
const SettingsPanel = lazy(() =>
  import('../ui/components/settings/SettingsPanel').then((m) => ({ default: m.SettingsPanel }))
)
const FileManager = lazy(() =>
  import('../ui/components/documents/FileManager').then((m) => ({ default: m.FileManager }))
)
const AgentProgress = lazy(() =>
  import('../ui/components/agent/AgentProgress').then((m) => ({ default: m.AgentProgress }))
)

/** Invisible while lazily loaded heavy panels aren't open yet */
function SilentFallback() { return null }

/** Thin progress-bar fallback while AgentProgress chunk loads */
function AgentFallback() {
  return (
    <div className="px-3 sm:px-6 pb-3">
      <div className="max-w-3xl mx-auto bg-card border border-border rounded-2xl p-4 animate-pulse">
        <div className="h-3 bg-muted rounded w-1/3 mb-3" />
        <div className="space-y-2">
          {[1, 2, 3].map((i) => <div key={i} className="h-8 bg-muted rounded-lg" />)}
        </div>
      </div>
    </div>
  )
}

export const ChatPage = memo(function ChatPage() {
  const { activeConversation, createConversation, conversations, isStreaming } = useChat()
  const { sendMessage, regenerateMessage, stopGenerating, availableProviders } = useAIService()
  const agent = useAgent()
  const docs = useDocuments()
  const editMessageAndTruncate = useChatStore((s) => s.editMessageAndTruncate)
  const addMessage = useChatStore((s) => s.addMessage)
  const updateMessage = useChatStore((s) => s.updateMessage)

  const [agentMode, setAgentMode] = useState(false)
  const [fileManagerOpen, setFileManagerOpen] = useState(false)
  const abortRef = useRef<AbortController | null>(null)

  useEffect(() => {
    if (conversations.length === 0) createConversation()
  }, [conversations.length, createConversation])

  const messages = activeConversation?.messages ?? []
  const lastAssistantMessage = [...messages].reverse().find((m) => m.role === 'assistant')

  async function handleSend(text: string) {
    if (!activeConversation) return

    // Agent mode
    if (agentMode) {
      addMessage(activeConversation.id, { role: 'user', content: text })
      agent.start(text)
      return
    }

    // RAG / Document Chat mode
    if (docs.ragMode && docs.hasDocuments) {
      addMessage(activeConversation.id, { role: 'user', content: text })
      const assistantId = addMessage(activeConversation.id, {
        role: 'assistant', content: '', isStreaming: true,
      })
      abortRef.current = new AbortController()
      try {
        const result = await docs.queryDocuments(text, abortRef.current.signal)
        const sourceLine =
          result.sources.length > 0
            ? `\n\n---\n*מקורות: ${[...new Set(result.sources.map((s) => s.chunk.documentName))].join(', ')}*`
            : ''
        updateMessage(activeConversation.id, assistantId, {
          content: result.answer + sourceLine,
          isStreaming: false,
          providerKey: 'claude',
        })
      } catch (err) {
        updateMessage(activeConversation.id, assistantId, {
          content: `❌ ${(err as Error).message}`,
          isStreaming: false,
        })
        toast.error((err as Error).message)
      }
      return
    }

    // Normal streaming chat
    await sendMessage(text, messages, activeConversation.id)
  }

  // Persist agent final result into conversation once complete
  useEffect(() => {
    if (agent.finalResult && !agent.isRunning && activeConversation) {
      addMessage(activeConversation.id, {
        role: 'assistant',
        content: agent.finalResult,
        agentSteps: agent.steps,
      })
      agent.reset()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [agent.finalResult, agent.isRunning])

  async function handleRegenerate(messageId: string) {
    if (!activeConversation) return
    await regenerateMessage(messages, activeConversation.id, messageId)
  }

  async function handleEdit(messageId: string, newContent: string) {
    if (!activeConversation) return
    editMessageAndTruncate(activeConversation.id, messageId, newContent)
    const historyBefore = messages.slice(0, messages.findIndex((m) => m.id === messageId))
    await sendMessage(newContent, historyBefore, activeConversation.id)
  }

  const isWorking = agentMode ? agent.isRunning : isStreaming

  return (
    <div className="flex h-full">
      <ErrorBoundary section="sidebar" compact>
        <Sidebar />
      </ErrorBoundary>

      <div className="flex-1 flex flex-col min-w-0">
        <ErrorBoundary section="chat-header" compact>
          <ChatHeader
            title={activeConversation?.title ?? 'שיחה חדשה'}
            availableProviders={availableProviders}
            agentMode={agentMode}
            onToggleAgentMode={() => setAgentMode((v) => !v)}
            ragMode={docs.ragMode}
            documentCount={docs.documents.length}
            onOpenFileManager={() => setFileManagerOpen(true)}
          />
        </ErrorBoundary>

        <ErrorBoundary section="chat-window">
          <ChatWindow
            messages={messages}
            isStreaming={isStreaming}
            routedProviderKey={lastAssistantMessage?.providerKey}
            onRegenerate={handleRegenerate}
            onEdit={handleEdit}
            onSuggestionClick={handleSend}
          />
        </ErrorBoundary>

        {(agent.isRunning || agent.steps.length > 0) && (
          <Suspense fallback={<AgentFallback />}>
            <ErrorBoundary section="agent-progress" compact>
              <div className="px-3 sm:px-6 pb-3 flex-shrink-0">
                <div className="max-w-3xl mx-auto">
                  <AgentProgress
                    goal={agent.goal}
                    steps={agent.steps}
                    isRunning={agent.isRunning}
                    finalResult={null}
                    onCancel={agent.cancel}
                    onRetryStep={agent.retryStep}
                  />
                </div>
              </div>
            </ErrorBoundary>
          </Suspense>
        )}

        <ErrorBoundary section="input-bar" compact>
          <InputBar
            onSend={handleSend}
            onStop={agentMode ? agent.cancel : stopGenerating}
            isStreaming={isWorking}
            placeholder={
              agentMode
                ? 'תאר משימה מרובת שלבים...'
                : docs.ragMode
                ? `שאל שאלה על המסמכים (${docs.documents.length} קבצים)`
                : undefined
            }
          />
        </ErrorBoundary>
      </div>

      {/* Lazy-loaded panels — only mount when first opened */}
      <Suspense fallback={<SilentFallback />}>
        <SettingsPanel />
      </Suspense>
      <Suspense fallback={<SilentFallback />}>
        <FileManager open={fileManagerOpen} onClose={() => setFileManagerOpen(false)} />
      </Suspense>
    </div>
  )
})
