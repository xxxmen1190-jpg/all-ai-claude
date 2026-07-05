import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { ParsedDocument } from '../../core/documents/DocumentTypes'
import { STORAGE_KEYS } from '../../lib/constants'

interface DocumentState {
  documents: ParsedDocument[]
  ragMode: boolean
  activeDocumentId: string | null

  addDocument: (doc: ParsedDocument) => void
  removeDocument: (id: string) => void
  updateDocument: (id: string, updates: Partial<ParsedDocument>) => void
  setRagMode: (on: boolean) => void
  setActiveDocument: (id: string | null) => void
  clearAll: () => void
}

export const useDocumentStore = create<DocumentState>()(
  persist(
    (set) => ({
      documents: [],
      ragMode: false,
      activeDocumentId: null,

      addDocument: (doc) =>
        set((s) => ({ documents: [doc, ...s.documents.filter((d) => d.id !== doc.id)] })),

      removeDocument: (id) =>
        set((s) => ({
          documents: s.documents.filter((d) => d.id !== id),
          activeDocumentId: s.activeDocumentId === id ? null : s.activeDocumentId,
        })),

      updateDocument: (id, updates) =>
        set((s) => ({
          documents: s.documents.map((d) => (d.id === id ? { ...d, ...updates } : d)),
        })),

      setRagMode: (ragMode) => set({ ragMode }),
      setActiveDocument: (activeDocumentId) => set({ activeDocumentId }),
      clearAll: () => set({ documents: [], activeDocumentId: null }),
    }),
    {
      name: STORAGE_KEYS.CONVERSATIONS + '_docs',
      // Don't persist chunk text (too large) — re-parse on load.
      // Only persist metadata so user can see their file list.
      partialize: (s) => ({
        documents: s.documents.map((d) => ({ ...d, chunks: [], text: '' })),
        ragMode: s.ragMode,
      }),
    }
  )
)
