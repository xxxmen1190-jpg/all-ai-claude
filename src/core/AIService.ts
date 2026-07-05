import type { ApiKeys, Intent, Message, ModelSelection, ProviderKey } from '../types'
import { ProviderRegistry } from './providers/ProviderRegistry'
import { AIRouter } from './router/AIRouter'
import { MemoryManager } from './memory/MemoryManager'
import { CacheService } from './services/CacheService'
import { RateLimitService } from './services/RateLimitService'
import { Logger } from './logging/Logger'
import { CACHE_TTL } from '../lib/constants'
import type { ChatMessage } from './providers/BaseProvider'
import { AnalyticsService } from './services/AnalyticsService'

export interface CompletionRequest {
  text: string
  history: Message[]
  systemPrompt: string
  model: ModelSelection
  signal?: AbortSignal
  useCache?: boolean
}

export interface CompletionResult {
  content: string
  providerKey: ProviderKey
  intent: Intent
  wasFallback: boolean
  fromCache: boolean
}

export interface StreamCallbacks {
  onToken: (token: string, fullText: string) => void
  onDone: (result: CompletionResult) => void
  onError: (error: Error) => void
}

export class RateLimitError extends Error {
  constructor() {
    super('חרגת ממכסת הבקשות לדקה. נסה שוב בעוד רגע.')
    this.name = 'RateLimitError'
  }
}

/**
 * The single entry point the UI talks to. Wires together:
 * ProviderRegistry → AIRouter → MemoryManager → CacheService →
 * RateLimitService → streaming/non-streaming execution → fallback → Logger.
 */
export class AIService {
  private registry: ProviderRegistry
  private router: AIRouter
  private memory = new MemoryManager()
  private static readonly RATE_LIMIT_KEY = 'global'

  constructor(apiKeys: ApiKeys) {
    this.registry = new ProviderRegistry(apiKeys)
    this.router = new AIRouter(this.registry)
  }

  updateApiKeys(apiKeys: ApiKeys): void {
    this.registry.rebuild(apiKeys)
  }

  getAvailableProviders(): ProviderKey[] {
    return this.registry.getAvailable()
  }

  isProviderAvailable(key: ProviderKey): boolean {
    return this.registry.isAvailable(key)
  }

  /** Non-streaming completion (used by Agent steps and providers without streaming support). */
  async complete(request: CompletionRequest): Promise<CompletionResult> {
    this.assertRateLimit()

    const decision = this.router.route(request.text, request.model)
    const context = this.memory.buildContext(request.history, request.systemPrompt, request.text)

    const cacheKey = CacheService.makeKey(decision.providerKey, context)
    if (request.useCache !== false) {
      const cached = CacheService.get(cacheKey)
      if (cached) {
        Logger.info('AIService', 'cache hit', { provider: decision.providerKey })
        return {
          content: cached,
          providerKey: decision.providerKey,
          intent: decision.intent,
          wasFallback: false,
          fromCache: true,
        }
      }
    }

    try {
      const content = await decision.provider.complete(context, { signal: request.signal })
      CacheService.set(cacheKey, content, CACHE_TTL.MEDIUM)
      AnalyticsService.track({ type: 'message_sent', provider: decision.providerKey, intent: decision.intent, success: true })
      Logger.info('AIService', 'completion success', { provider: decision.providerKey, intent: decision.intent })
      return {
        content,
        providerKey: decision.providerKey,
        intent: decision.intent,
        wasFallback: false,
        fromCache: false,
      }
    } catch (error) {
      return this.handleCompletionFallback(error, decision.intent, context, request.signal)
    }
  }

  /** Streaming completion with token callbacks. Falls back to Claude on provider failure. */
  async streamCompletion(request: CompletionRequest, callbacks: StreamCallbacks): Promise<void> {
    try {
      this.assertRateLimit()
    } catch (error) {
      callbacks.onError(error as Error)
      return
    }

    const decision = this.router.route(request.text, request.model)
    const context = this.memory.buildContext(request.history, request.systemPrompt, request.text)

    if (!decision.provider.supportsStreaming) {
      // Provider can't stream (e.g. ElevenLabs/DALL-E routed by mistake) — use complete() instead.
      try {
        const content = await decision.provider.complete(context, { signal: request.signal })
        callbacks.onToken(content, content)
        callbacks.onDone({
          content,
          providerKey: decision.providerKey,
          intent: decision.intent,
          wasFallback: false,
          fromCache: false,
        })
      } catch (error) {
        callbacks.onError(error as Error)
      }
      return
    }

    let fullText = ''
    try {
      for await (const token of decision.provider.stream(context, { signal: request.signal })) {
        fullText += token
        callbacks.onToken(token, fullText)
      }
      AnalyticsService.track({ type: 'message_sent', provider: decision.providerKey, intent: decision.intent, success: true })
      Logger.info('AIService', 'stream success', { provider: decision.providerKey, intent: decision.intent })
      callbacks.onDone({
        content: fullText,
        providerKey: decision.providerKey,
        intent: decision.intent,
        wasFallback: false,
        fromCache: false,
      })
    } catch (error) {
      if ((error as Error).name === 'AbortError') {
        // User-initiated stop — not a failure, resolve with what we have so far.
        callbacks.onDone({
          content: fullText,
          providerKey: decision.providerKey,
          intent: decision.intent,
          wasFallback: false,
          fromCache: false,
        })
        return
      }

      Logger.warn('AIService', 'stream failed, attempting fallback', {
        provider: decision.providerKey,
        error: (error as Error).message,
      })

      await this.streamFallback(decision.intent, decision.providerKey, context, request.signal, callbacks)
    }
  }

  /** Used for "Regenerate" — re-runs the last user message with a fresh provider pick. */
  async regenerate(
    history: Message[],
    systemPrompt: string,
    model: ModelSelection,
    callbacks: StreamCallbacks
  ): Promise<void> {
    const lastUserMessage = [...history].reverse().find((m) => m.role === 'user')
    if (!lastUserMessage) {
      callbacks.onError(new Error('No previous user message to regenerate from'))
      return
    }
    const historyWithoutLast = history.slice(0, history.lastIndexOf(lastUserMessage))
    await this.streamCompletion(
      { text: lastUserMessage.content, history: historyWithoutLast, systemPrompt, model, useCache: false },
      callbacks
    )
  }

  private async streamFallback(
    failedIntent: Intent,
    failedProvider: ProviderKey,
    context: ChatMessage[],
    signal: AbortSignal | undefined,
    callbacks: StreamCallbacks
  ): Promise<void> {
    const chain = this.router.getFallbackChain(failedIntent).filter((p) => p !== failedProvider)
    const nextKey = chain.find((p) => this.registry.isAvailable(p) && this.registry.get(p).supportsStreaming)
      ?? ('claude' as ProviderKey)

    if (nextKey === failedProvider || !this.registry.isAvailable(nextKey)) {
      callbacks.onError(new Error(`${failedProvider}: כל הספקים הזמינים נכשלו`))
      return
    }

    const provider = this.registry.get(nextKey)
    let fullText = ''
    try {
      for await (const token of provider.stream(context, { signal })) {
        fullText += token
        callbacks.onToken(token, fullText)
      }
      callbacks.onDone({
        content: fullText,
        providerKey: nextKey,
        intent: failedIntent,
        wasFallback: true,
        fromCache: false,
      })
    } catch (fallbackError) {
      Logger.error('AIService', 'fallback also failed', { provider: nextKey, error: (fallbackError as Error).message })
      callbacks.onError(fallbackError as Error)
    }
  }

  private async handleCompletionFallback(
    originalError: unknown,
    intent: Intent,
    context: ChatMessage[],
    signal?: AbortSignal
  ): Promise<CompletionResult> {
    const chain = this.router.getFallbackChain(intent)
    for (const key of chain) {
      if (!this.registry.isAvailable(key)) continue
      try {
        const provider = this.registry.get(key)
        const content = await provider.complete(context, { signal })
        Logger.warn('AIService', 'completion succeeded via fallback', { provider: key })
        return { content, providerKey: key, intent, wasFallback: true, fromCache: false }
      } catch {
        continue
      }
    }
    Logger.error('AIService', 'all providers failed', { error: (originalError as Error).message })
    throw originalError instanceof Error ? originalError : new Error('All providers failed')
  }

  private assertRateLimit(): void {
    if (!RateLimitService.check(AIService.RATE_LIMIT_KEY)) {
      throw new RateLimitError()
    }
  }
}


