import type { ApiKeys, ProviderKey } from '../../types'
import { BaseProvider } from './BaseProvider'
import { ClaudeProvider } from './ClaudeProvider'
import { OpenAIProvider } from './OpenAIProvider'
import { GeminiProvider } from './GeminiProvider'
import { GroqProvider } from './GroqProvider'
import { OpenRouterProvider } from './OpenRouterProvider'
import { MistralProvider } from './MistralProvider'
import { DeepSeekProvider } from './DeepSeekProvider'
import { PerplexityProvider } from './PerplexityProvider'
import { ElevenLabsProvider } from './ElevenLabsProvider'

type ProviderConstructor = new (apiKey: string) => BaseProvider

/**
 * Factory/Registry for all AI providers.
 * To add a new provider in the future:
 *   1. Create NewProvider.ts implementing BaseProvider
 *   2. Add one line to PROVIDER_CONSTRUCTORS below
 * Nothing else in the app needs to change.
 */
const PROVIDER_CONSTRUCTORS: Record<ProviderKey, ProviderConstructor> = {
  claude: ClaudeProvider,
  gpt: OpenAIProvider,
  gemini: GeminiProvider,
  groq: GroqProvider,
  openrouter: OpenRouterProvider,
  mistral: MistralProvider,
  deepseek: DeepSeekProvider,
  perplexity: PerplexityProvider,
  elevenlabs: ElevenLabsProvider,
  // 'dalle' is not a separate API — it's OpenAIProvider.generateImage().
  // Mapped to the same constructor so registry lookups for 'dalle' resolve correctly.
  dalle: OpenAIProvider,
}

export class ProviderRegistry {
  private instances = new Map<ProviderKey, BaseProvider>()

  constructor(apiKeys: ApiKeys) {
    this.rebuild(apiKeys)
  }

  /** Rebuilds all provider instances from the current API keys (call when settings change). */
  rebuild(apiKeys: ApiKeys): void {
    for (const key of Object.keys(PROVIDER_CONSTRUCTORS) as ProviderKey[]) {
      const Ctor = PROVIDER_CONSTRUCTORS[key]
      const apiKeyValue = key === 'dalle' ? apiKeys.dalle || apiKeys.gpt : apiKeys[key]
      const existing = this.instances.get(key)
      if (existing) {
        existing.updateKey(apiKeyValue)
      } else {
        this.instances.set(key, new Ctor(apiKeyValue))
      }
    }
  }

  get(key: ProviderKey): BaseProvider {
    const provider = this.instances.get(key)
    if (!provider) throw new Error(`ProviderRegistry: unknown provider "${key}"`)
    return provider
  }

  isAvailable(key: ProviderKey): boolean {
    return this.instances.get(key)?.isAvailable() ?? false
  }

  getAvailable(): ProviderKey[] {
    return Array.from(this.instances.entries())
      .filter(([, p]) => p.isAvailable())
      .map(([k]) => k)
  }

  getAll(): Map<ProviderKey, BaseProvider> {
    return this.instances
  }
}
