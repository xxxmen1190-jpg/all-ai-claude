import { useEffect, useRef, useMemo } from 'react'
import toast from 'react-hot-toast'
import { AIService, RateLimitError, type CompletionResult } from '../../core/AIService'
import { MediaService } from '../../core/MediaService'
import { useSettingsStore } from '../store/settingsStore'
import { useChatStore } from '../store/chatStore'
import type { Message, ModelSelection } from '../../types'

/**
 * Bridges the AI core layer (AIService/MediaService) into React.
 * Owns the AbortController used for "Stop Generating".
 */
export function useAIService() {
  const apiKeys = useSettingsStore((s) => s.apiKeys)
  const systemPrompt = useSettingsStore((s) => s.systemPrompt)
  const model = useSettingsStore((s) => s.model)

  const { addMessage, updateMessage, setStreaming, appendStreamText } = useChatStore()

  const aiServiceRef = useRef<AIService | null>(null)
  const mediaServiceRef = useRef<MediaService | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  if (!aiServiceRef.current) {
    aiServiceRef.current = new AIService(apiKeys)
    mediaServiceRef.current = new MediaService(apiKeys)
  }

  useEffect(() => {
    aiServiceRef.current?.updateApiKeys(apiKeys)
    mediaServiceRef.current?.updateApiKeys(apiKeys)
  }, [apiKeys])

  const availableProviders = useMemo(
    () => aiServiceRef.current?.getAvailableProviders() ?? [],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [apiKeys]
  )

  function stopGenerating() {
    abortControllerRef.current?.abort()
  }

  async function sendMessage(
    text: string,
    history: Message[],
    conversationId: string,
    modelOverride?: ModelSelection
  ) {
    const aiService = aiServiceRef.current!
    abortControllerRef.current = new AbortController()

    addMessage(conversationId, { role: 'user', content: text })
    setStreaming(true, '')

    const assistantMessageId = addMessage(conversationId, {
      role: 'assistant',
      content: '',
      isStreaming: true,
    })

    await aiService.streamCompletion(
      {
        text,
        history,
        systemPrompt,
        model: modelOverride ?? model,
        signal: abortControllerRef.current.signal,
      },
      {
        onToken: (_token, fullText) => {
          appendStreamText(_token)
          updateMessage(conversationId, assistantMessageId, { content: fullText })
        },
        onDone: (result: CompletionResult) => {
          updateMessage(conversationId, assistantMessageId, {
            content: result.content,
            providerKey: result.providerKey,
            intent: result.intent,
            isFallback: result.wasFallback,
            isStreaming: false,
          })
          if (result.wasFallback) {
            toast(`עבר אוטומטית ל-${result.providerKey} בגלל תקלה בספק המקורי`, { icon: '⚠️' })
          }
          setStreaming(false, '')
        },
        onError: (error: Error) => {
          const isRateLimit = error instanceof RateLimitError
          updateMessage(conversationId, assistantMessageId, {
            content: isRateLimit ? error.message : `❌ שגיאה: ${error.message}`,
            isStreaming: false,
          })
          toast.error(isRateLimit ? error.message : 'שגיאה בקבלת תשובה')
          setStreaming(false, '')
        },
      }
    )
  }

  async function regenerateMessage(
    history: Message[],
    conversationId: string,
    assistantMessageId: string,
    modelOverride?: ModelSelection
  ) {
    const aiService = aiServiceRef.current!
    abortControllerRef.current = new AbortController()
    setStreaming(true, '')
    updateMessage(conversationId, assistantMessageId, { content: '', isStreaming: true })

    await aiService.regenerate(history, systemPrompt, modelOverride ?? model, {
      onToken: (_token, fullText) => {
        appendStreamText(_token)
        updateMessage(conversationId, assistantMessageId, { content: fullText })
      },
      onDone: (result) => {
        updateMessage(conversationId, assistantMessageId, {
          content: result.content,
          providerKey: result.providerKey,
          intent: result.intent,
          isFallback: result.wasFallback,
          isStreaming: false,
        })
        setStreaming(false, '')
      },
      onError: (error) => {
        updateMessage(conversationId, assistantMessageId, {
          content: `❌ שגיאה: ${error.message}`,
          isStreaming: false,
        })
        toast.error('שגיאה ביצירה מחדש')
        setStreaming(false, '')
      },
    })
  }

  return {
    sendMessage,
    regenerateMessage,
    stopGenerating,
    availableProviders,
    mediaService: mediaServiceRef.current!,
  }
}
