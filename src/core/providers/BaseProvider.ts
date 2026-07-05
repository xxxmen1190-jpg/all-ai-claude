import type { ProviderKey } from '../../types'
import { withRetry } from '../services/RetryService'

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
}

export interface CompletionOptions {
  signal?: AbortSignal
}


export interface ImageGenResult {
  url: string
}

export interface VoiceGenResult {
  audioUrl: string
}

/**
 * Every AI provider must implement this interface.
 * Adding a new provider = create one file implementing BaseProvider
 * and register it in ProviderRegistry. Nothing else changes.
 */
export abstract class BaseProvider {
  abstract readonly key: ProviderKey
  abstract readonly displayName: string
  abstract readonly supportsStreaming: boolean
  abstract readonly supportsImageGen: boolean
  abstract readonly supportsVoiceGen: boolean

  protected apiKey: string
  protected timeoutMs = 30_000
  protected maxRetries = 2

  constructor(apiKey: string) {
    this.apiKey = apiKey
  }

  isAvailable(): boolean {
    return this.apiKey.trim().length > 0
  }

  updateKey(apiKey: string): void {
    this.apiKey = apiKey
  }

  /** Non-streaming completion. Every text provider must implement this. */
  abstract complete(messages: ChatMessage[], options?: CompletionOptions): Promise<string>

  /** Streaming completion. Providers without native streaming should throw. */
  abstract stream(
    messages: ChatMessage[],
    options?: CompletionOptions
  ): AsyncGenerator<string, void, unknown>

  /** Optional: only OpenAI-compatible image providers implement this. */
  generateImage?(prompt: string, options?: CompletionOptions): Promise<ImageGenResult>

  /** Optional: only voice providers implement this. */
  generateVoice?(text: string, options?: CompletionOptions): Promise<VoiceGenResult>

  protected async withRetryAndTimeout<T>(fn: (signal: AbortSignal) => Promise<T>): Promise<T> {
    return withRetry(
      fn,
      {
        maxRetries: this.maxRetries,
        shouldRetry: (err) => {
          if (err instanceof Error && /401|403|invalid.?api.?key/i.test(err.message)) {
            return false // never retry on auth errors
          }
          return true
        },
      },
      this.timeoutMs
    )
  }

  protected async parseErrorResponse(res: Response): Promise<string> {
    try {
      const data = await res.json()
      return data?.error?.message || data?.message || res.statusText
    } catch {
      return res.statusText || `HTTP ${res.status}`
    }
  }
}

// ── Shared SSE stream reader ──────────────────────────────
/**
 * Reads a Server-Sent Events stream body and yields parsed data payloads.
 * Eliminates the identical reader/decoder/buffer loop duplicated across providers.
 */
export async function* readSSEStream(
  body: ReadableStream<Uint8Array>,
  extractToken: (parsed: unknown) => string | null | undefined
): AsyncGenerator<string, void, unknown> {
  const reader = body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''

  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() ?? ''

      for (const line of lines) {
        if (!line.startsWith('data:')) continue
        const raw = line.slice(5).trim()
        if (!raw || raw === '[DONE]') continue
        try {
          const token = extractToken(JSON.parse(raw))
          if (token) yield token
        } catch {
          // skip malformed chunk
        }
      }
    }
  } finally {
    reader.releaseLock()
  }
}
