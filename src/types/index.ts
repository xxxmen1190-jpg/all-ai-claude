export type MessageRole = 'user' | 'assistant' | 'system'

export interface Message {
  id: string
  role: MessageRole
  content: string
  providerKey?: ProviderKey
  intent?: Intent
  image?: string
  audio?: string
  isStreaming?: boolean
  isFallback?: boolean
  timestamp: number
  agentSteps?: AgentStep[]
}

export interface Conversation {
  id: string
  title: string
  messages: Message[]
  createdAt: number
  updatedAt: number
  model: ModelSelection
}

export type ProviderKey =
  | 'claude' | 'gpt' | 'gemini' | 'groq'
  | 'openrouter' | 'mistral' | 'deepseek'
  | 'perplexity' | 'elevenlabs' | 'dalle'

export type ModelSelection = 'auto' | ProviderKey

export interface ProviderMeta {
  name: string
  emoji: string
  color: string
  desc: string
  supportsStreaming: boolean
  supportsImages?: boolean
  supportsVoice?: boolean
}

export type Intent =
  | 'code' | 'creative' | 'search' | 'image'
  | 'voice' | 'fast' | 'reasoning' | 'general'
  | 'translate' | 'summarize' | 'agent'

export type AgentStepStatus = 'pending' | 'running' | 'done' | 'error'
export type AgentStepType =
  | 'search' | 'analyze' | 'summarize' | 'write'
  | 'translate' | 'generate_image' | 'generate_voice'

export interface AgentStep {
  id: string
  type: AgentStepType
  label: string
  status: AgentStepStatus
  result?: string
  provider?: ProviderKey
}

export type Theme = 'dark' | 'light' | 'system'

export interface ApiKeys {
  claude: string
  gpt: string
  gemini: string
  groq: string
  openrouter: string
  mistral: string
  deepseek: string
  perplexity: string
  elevenlabs: string
  dalle: string
}

export interface Settings {
  theme: Theme
  model: ModelSelection
  systemPrompt: string
  apiKeys: ApiKeys
  streamingEnabled: boolean
}

export interface CacheEntry {
  result: string
  timestamp: number
  ttl: number
}

export type ToolName =
  | 'web_search' | 'image_gen' | 'voice_gen'
  | 'code_gen' | 'translate' | 'summarize' | 'file_read'

export interface ToolResult {
  tool: ToolName
  success: boolean
  data?: string | { url: string } | { audioUrl: string }
  error?: string
}

// ── Templates ──────────────────────────────────────────────
export interface PromptTemplate {
  id: string
  name: string
  description: string
  content: string
  category: 'coding' | 'writing' | 'analysis' | 'general' | 'custom'
  icon: string
  createdAt: number
}

// ── Personas ───────────────────────────────────────────────
export interface Persona {
  id: string
  name: string
  description: string
  systemPrompt: string
  icon: string
  color: string
  preferredModel: ModelSelection
  createdAt: number
}

// ── Model Presets ──────────────────────────────────────────
export interface ModelPreset {
  id: string
  name: string
  description: string
  model: ModelSelection
  systemPrompt: string
  icon: string
}

// ── Analytics ──────────────────────────────────────────────
export interface AnalyticsEvent {
  type: 'message_sent' | 'provider_used' | 'agent_run' | 'document_uploaded' | 'error'
  provider?: string
  intent?: string
  success: boolean
  timestamp: number
}

export interface AnalyticsSummary {
  totalMessages: number
  messagesByProvider: Record<string, number>
  successRate: number
  agentRuns: number
  documentsUploaded: number
  favoriteProvider: string
  periodDays: number
}

// ── Keyboard Shortcuts ──────────────────────────────────────
export interface KeyboardShortcut {
  key: string
  modifier: 'ctrl' | 'meta' | 'alt' | 'shift' | 'none'
  description: string
  action: string
}
