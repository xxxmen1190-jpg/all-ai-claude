import { create } from 'zustand'

interface UIState {
  sidebarOpen: boolean
  settingsOpen: boolean
  searchQuery: string
  editingMessageId: string | null
  pinnedMessageIds: string[]

  toggleSidebar: () => void
  setSidebarOpen: (open: boolean) => void
  toggleSettings: () => void
  setSettingsOpen: (open: boolean) => void
  setSearchQuery: (query: string) => void
  setEditingMessageId: (id: string | null) => void
  togglePin: (messageId: string) => void
  isPinned: (messageId: string) => boolean
}

export const useUIStore = create<UIState>((set, get) => ({
  sidebarOpen: true,
  settingsOpen: false,
  searchQuery: '',
  editingMessageId: null,
  pinnedMessageIds: [],

  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),
  toggleSettings: () => set((s) => ({ settingsOpen: !s.settingsOpen })),
  setSettingsOpen: (settingsOpen) => set({ settingsOpen }),
  setSearchQuery: (searchQuery) => set({ searchQuery }),
  setEditingMessageId: (editingMessageId) => set({ editingMessageId }),
  togglePin: (messageId) =>
    set((s) => ({
      pinnedMessageIds: s.pinnedMessageIds.includes(messageId)
        ? s.pinnedMessageIds.filter((id) => id !== messageId)
        : [...s.pinnedMessageIds, messageId],
    })),
  isPinned: (messageId) => get().pinnedMessageIds.includes(messageId),
}))
