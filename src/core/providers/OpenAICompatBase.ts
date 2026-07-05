import { BaseProvider, readSSEStream, type ChatMessage, type CompletionOptions } from './BaseProvider'

interface OpenAICompatSSEChunk {
  choices?: { delta?: { content?: string } }[]
}

/**
 * Shared base for any provider exposing an OpenAI-compatible
 * /chat/completions endpoint (Groq, OpenRouter, Mistral, DeepSeek, Perplexity).
 * Concrete providers only declare endpoint/model/displayName/key —
 * all request/stream parsing logic lives here once.
 */
export abstract class OpenAICompatBase extends BaseProvider {
  readonly supportsStreaming = true
  readonly supportsImageGen = false
  readonly supportsVoiceGen = false

  protected abstract readonly endpoint: string
  protected abstract readonly model: string

  protected headers(): Record<string, string> {
    return { 'Content-Type': 'application/json', Authorization: `Bearer ${this.apiKey}` }
  }

  protected buildBody(messages: ChatMessage[], stream: boolean) {
    return {
      model: this.model,
      stream,
      messages: messages.map((m) => ({ role: m.role, content: m.content })),
    }
  }

  async complete(messages: ChatMessage[], options?: CompletionOptions): Promise<string> {
    if (!this.isAvailable()) throw new Error(`${this.displayName}: API key missing`)
    return this.withRetryAndTimeout(async (signal) => {
      const res = await fetch(this.endpoint, {
        method: 'POST',
        signal: options?.signal ?? signal,
        headers: this.headers(),
        body: JSON.stringify(this.buildBody(messages, false)),
      })
      if (!res.ok) throw new Error(`${this.displayName}: ${await this.parseErrorResponse(res)}`)
      const data = await res.json()
      return data.choices?.[0]?.message?.content ?? ''
    })
  }

  async *stream(
    messages: ChatMessage[],
    options?: CompletionOptions
  ): AsyncGenerator<string, void, unknown> {
    if (!this.isAvailable()) throw new Error(`${this.displayName}: API key missing`)
    const res = await fetch(this.endpoint, {
      method: 'POST',
      signal: options?.signal,
      headers: this.headers(),
      body: JSON.stringify(this.buildBody(messages, true)),
    })
    if (!res.ok || !res.body) throw new Error(`${this.displayName}: ${await this.parseErrorResponse(res)}`)

    yield* readSSEStream(res.body, (json) => (json as OpenAICompatSSEChunk).choices?.[0]?.delta?.content)
  }
}
