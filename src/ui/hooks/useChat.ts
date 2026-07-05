import { useCallback } from 'react'
import { useChatStore } from '../store/chatStore'
import { useSettingsStore } from '../store/settingsStore'

export function useChat() {
  const {
    conversations, activeConversationId, isStreaming, streamingText,
    activeConversation, createConversation, deleteConversation,
    setActiveConversation, addMessage, updateMessage, setStreaming, appendStreamText,
  } = useChatStore()

  const { model, apiKeys, systemPrompt, streamingEnabled } = useSettingsStore()

  const ensureConversation = useCallback(() => {
    if (!activeConversationId) return createConversation()
    return activeConversationId
  }, [activeConversationId, createConversation])

  return {
    conversations,
    activeConversationId,
    activeConversation: activeConversation(),
    isStreaming,
    streamingText,
    model,
    apiKeys,
    systemPrompt,
    streamingEnabled,
    createConversation,
    deleteConversation,
    setActiveConversation,
    addMessage,
    updateMessage,
    setStreaming,
    appendStreamText,
    ensureConversation,
  }
}
