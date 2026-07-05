import type { Intent, ModelSelection, ProviderKey } from '../../types'
import type { BaseProvider } from '../providers/BaseProvider'
import type { ProviderRegistry } from '../providers/ProviderRegistry'
import { IntentClassifier } from './IntentClassifier'

export interface RouteDecision {
  provider: BaseProvider
  providerKey: ProviderKey
  intent: Intent
  confidence: number
  wasManualOverride: boolean
}

/**
 * Ordered candidate list per intent. The router walks this list
 * and picks the first provider that has a valid API key configured.
 * Falls back to 'claude' if nothing in the chain is available.
 */
const ROUTING_TABLE: Record<Intent, ProviderKey[]> = {
  image: ['dalle'],
  voice: ['elevenlabs'],
  search: ['perplexity', 'gemini', 'claude'],
  code: ['deepseek', 'groq', 'gpt', 'claude'],
  translate: ['gpt', 'claude', 'mistral'],
  summarize: ['claude', 'gpt', 'gemini'],
  fast: ['groq', 'openrouter', 'claude'],
  creative: ['claude', 'gpt', 'openrouter'],
  reasoning: ['claude', 'gpt', 'gemini'],
  agent: ['claude', 'gpt'],
  general: ['claude', 'gpt', 'groq', 'openrouter'],
}

export class AIRouter {
  private classifier = new IntentClassifier()

  constructor(private registry: ProviderRegistry) {}

  /**
   * Decides which provider should handle a given user message.
   * @param text user input
   * @param manualOverride 'auto' for smart routing, or an explicit ProviderKey
   */
  route(text: string, manualOverride: ModelSelection = 'auto'): RouteDecision {
    const { intent, confidence } = this.classifier.classify(text)

    if (manualOverride !== 'auto') {
      if (this.registry.isAvailable(manualOverride)) {
        return {
          provider: this.registry.get(manualOverride),
          providerKey: manualOverride,
          intent,
          confidence,
          wasManualOverride: true,
        }
      }
      // Manual choice unavailable (no key) — fall through to auto routing instead of failing.
    }

    const candidates = ROUTING_TABLE[intent] ?? ROUTING_TABLE.general
    for (const candidateKey of candidates) {
      if (this.registry.isAvailable(candidateKey)) {
        return {
          provider: this.registry.get(candidateKey),
          providerKey: candidateKey,
          intent,
          confidence,
          wasManualOverride: false,
        }
      }
    }

    // Absolute last resort — Claude is always treated as configured by the app shell.
    return {
      provider: this.registry.get('claude'),
      providerKey: 'claude',
      intent,
      confidence,
      wasManualOverride: false,
    }
  }

  /** Returns the fallback chain for a given intent, useful for retry-on-failure logic. */
  getFallbackChain(intent: Intent): ProviderKey[] {
    return ROUTING_TABLE[intent] ?? ROUTING_TABLE.general
  }
}
