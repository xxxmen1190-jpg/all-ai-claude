import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Conversation, Message } from '../../types'
import { generateId, truncate } from '../../lib/utils'
import { STORAGE_KEYS } from '../../lib/constants'

interface ChatState {
  conversations: Conversation[]
  activeConversationId: string | null
  isStreaming: boolean
  streamingText: string

  activeConversation: () => Conversation | undefined
  createConversation: () => string
  renameConversation: (id: string, title: string) => void
  deleteConversation: (id: string) => void
  setActiveConversation: (id: string) => void
  addMessage: (conversationId: string, message: Omit<Message, 'id' | 'timestamp'>) => string
  updateMessage: (conversationId: string, messageId: string, updates: Partial<Message>) => void
  editMessageAndTruncate: (conversationId: string, messageId: string, newContent: string) => void
  deleteMessage: (conversationId: string, messageId: string) => void
  setStreaming: (streaming: boolean, text?: string) => void
  appendStreamText: (token: string) => void
  clearHistory: () => void
}

export const useChatStore = create<ChatState>()(
  persist(
    (set, get) => ({
      conversations: [],
      activeConversationId: null,
      isStreaming: false,
      streamingText: '',

      activeConversation: () => {
        const { conversations, activeConversationId } = get()
        return conversations.find((c) => c.id === activeConversationId)
      },

      createConversation: () => {
        const id = generateId()
        const now = Date.now()
        const conv: Conversation = {
          id,
          title: 'שיחה חדשה',
          messages: [],
          createdAt: now,
          updatedAt: now,
          model: 'auto',
        }
        set((state) => ({
          conversations: [conv, ...state.conversations],
          activeConversationId: id,
        }))
        return id
      },

      renameConversation: (id, title) =>
        set((state) => ({
          conversations: state.conversations.map((c) =>
            c.id === id ? { ...c, title, updatedAt: Date.now() } : c
          ),
        })),

      deleteConversation: (id) =>
        set((state) => {
          const filtered = state.conversations.filter((c) => c.id !== id)
          return {
            conversations: filtered,
            activeConversationId:
              state.activeConversationId === id
                ? filtered[0]?.id ?? null
                : state.activeConversationId,
          }
        }),

      setActiveConversation: (id) => set({ activeConversationId: id }),

      addMessage: (conversationId, message) => {
        const id = generateId()
        const fullMessage: Message = { ...message, id, timestamp: Date.now() }
        set((state) => ({
          conversations: state.conversations.map((c) => {
            if (c.id !== conversationId) return c
            const isFirst = c.messages.length === 0 && message.role === 'user'
            return {
              ...c,
              title: isFirst ? truncate(message.content, 40) : c.title,
              messages: [...c.messages, fullMessage],
              updatedAt: Date.now(),
            }
          }),
        }))
        return id
      },

      updateMessage: (conversationId, messageId, updates) =>
        set((state) => ({
          conversations: state.conversations.map((c) =>
            c.id !== conversationId
              ? c
              : { ...c, messages: c.messages.map((m) => (m.id === messageId ? { ...m, ...updates } : m)) }
          ),
        })),

      editMessageAndTruncate: (conversationId, messageId, newContent) =>
        set((state) => ({
          conversations: state.conversations.map((c) => {
            if (c.id !== conversationId) return c
            const idx = c.messages.findIndex((m) => m.id === messageId)
            if (idx === -1) return c
            const truncated = c.messages.slice(0, idx)
            return {
              ...c,
              messages: [...truncated, { ...c.messages[idx], content: newContent, timestamp: Date.now() }],
              updatedAt: Date.now(),
            }
          }),
        })),

      deleteMessage: (conversationId, messageId) =>
        set((state) => ({
          conversations: state.conversations.map((c) =>
            c.id !== conversationId
              ? c
              : { ...c, messages: c.messages.filter((m) => m.id !== messageId) }
          ),
        })),

      setStreaming: (isStreaming, text = '') =>
        set({ isStreaming, streamingText: text }),

      appendStreamText: (token) =>
        set((state) => ({ streamingText: state.streamingText + token })),

      clearHistory: () => set({ conversations: [], activeConversationId: null }),
    }),
    {
      name: STORAGE_KEYS.CONVERSATIONS,
      partialize: (state) => ({
        conversations: state.conversations,
        activeConversationId: state.activeConversationId,
      }),
    }
  )
)
