import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { generateId } from '../../lib/utils'
import type {
  Settings, Theme, ModelSelection, ApiKeys,
  PromptTemplate, Persona, ModelPreset
} from '../../types'
import {
  DEFAULT_API_KEYS, DEFAULT_SYSTEM_PROMPT, STORAGE_KEYS,
  DEFAULT_TEMPLATES, DEFAULT_PERSONAS, DEFAULT_MODEL_PRESETS
} from '../../lib/constants'

interface SettingsState extends Settings {
  templates: PromptTemplate[]
  personas: Persona[]
  modelPresets: ModelPreset[]
  activePersonaId: string | null

  // Theme / model / prompt
  setTheme: (theme: Theme) => void
  setModel: (model: ModelSelection) => void
  setSystemPrompt: (prompt: string) => void

  // API keys
  setApiKey: (provider: keyof ApiKeys, key: string) => void
  setApiKeys: (keys: ApiKeys) => void

  // Streaming
  setStreamingEnabled: (enabled: boolean) => void

  // Templates CRUD
  addTemplate: (t: Omit<PromptTemplate, 'id' | 'createdAt'>) => void
  updateTemplate: (id: string, updates: Partial<PromptTemplate>) => void
  deleteTemplate: (id: string) => void

  // Personas CRUD
  addPersona: (p: Omit<Persona, 'id' | 'createdAt'>) => void
  updatePersona: (id: string, updates: Partial<Persona>) => void
  deletePersona: (id: string) => void
  activatePersona: (id: string | null) => void

  // Model presets
  applyPreset: (presetId: string) => void
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      theme: 'dark' as Theme,
      model: 'auto' as ModelSelection,
      systemPrompt: DEFAULT_SYSTEM_PROMPT,
      apiKeys: DEFAULT_API_KEYS,
      streamingEnabled: true,
      templates: DEFAULT_TEMPLATES,
      personas: DEFAULT_PERSONAS,
      modelPresets: DEFAULT_MODEL_PRESETS,
      activePersonaId: null,

      setTheme: (theme) => set({ theme }),
      setModel: (model) => set({ model }),
      setSystemPrompt: (systemPrompt) => set({ systemPrompt }),
      setApiKey: (provider, key) =>
        set((s) => ({ apiKeys: { ...s.apiKeys, [provider]: key } })),
      setApiKeys: (apiKeys) => set({ apiKeys }),
      setStreamingEnabled: (streamingEnabled) => set({ streamingEnabled }),

      addTemplate: (t) =>
        set((s) => ({
          templates: [
            ...s.templates,
            { ...t, id: generateId(), createdAt: Date.now() },
          ],
        })),
      updateTemplate: (id, updates) =>
        set((s) => ({
          templates: s.templates.map((t) => (t.id === id ? { ...t, ...updates } : t)),
        })),
      deleteTemplate: (id) =>
        set((s) => ({
          templates: s.templates.filter((t) => t.id !== id),
        })),

      addPersona: (p) =>
        set((s) => ({
          personas: [
            ...s.personas,
            { ...p, id: generateId(), createdAt: Date.now() },
          ],
        })),
      updatePersona: (id, updates) =>
        set((s) => ({
          personas: s.personas.map((p) => (p.id === id ? { ...p, ...updates } : p)),
        })),
      deletePersona: (id) =>
        set((s) => ({
          personas: s.personas.filter((p) => p.id !== id),
          activePersonaId: s.activePersonaId === id ? null : s.activePersonaId,
        })),
      activatePersona: (id) => {
        const persona = id ? get().personas.find((p) => p.id === id) : null
        set({
          activePersonaId: id,
          ...(persona
            ? { systemPrompt: persona.systemPrompt, model: persona.preferredModel }
            : {}),
        })
      },

      applyPreset: (presetId) => {
        const preset = get().modelPresets.find((p) => p.id === presetId)
        if (preset) set({ model: preset.model, systemPrompt: preset.systemPrompt })
      },
    }),
    { name: STORAGE_KEYS.SETTINGS }
  )
)
