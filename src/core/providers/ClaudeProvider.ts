import { BaseProvider, readSSEStream, type ChatMessage, type CompletionOptions } from './BaseProvider'
import type { ProviderKey } from '../../types'

interface AnthropicSSEEvent {
  type: string
  delta?: { text?: string }
}

export class ClaudeProvider extends BaseProvider {
  readonly key: ProviderKey = 'claude'
  readonly displayName = 'Claude'
  readonly supportsStreaming = true
  readonly supportsImageGen = false
  readonly supportsVoiceGen = false

  private readonly model = 'claude-sonnet-4-6'
  private readonly endpoint = 'https://api.anthropic.com/v1/messages'

  private buildBody(messages: ChatMessage[], stream: boolean) {
    const system =
      messages.find((m) => m.role === 'system')?.content ||
      'You are a helpful AI assistant. Answer in the user\'s language.'
    const conversational = messages
      .filter((m) => m.role !== 'system')
      .map((m) => ({ role: m.role, content: m.content }))
    return { model: this.model, max_tokens: 2048, system, messages: conversational, stream }
  }

  private headers() {
    return {
      'Content-Type': 'application/json',
      'anthropic-version': '2023-06-01',
      'x-api-key': this.apiKey,
      'anthropic-dangerous-direct-browser-access': 'true',
    }
  }

  async complete(messages: ChatMessage[], options?: CompletionOptions): Promise<string> {
    if (!this.isAvailable()) throw new Error('Claude: API key missing')
    return this.withRetryAndTimeout(async (signal) => {
      const res = await fetch(this.endpoint, {
        method: 'POST',
        signal: options?.signal ?? signal,
        headers: this.headers(),
        body: JSON.stringify(this.buildBody(messages, false)),
      })
      if (!res.ok) throw new Error(`Claude: ${await this.parseErrorResponse(res)}`)
      const data = await res.json()
      return data.content?.[0]?.text ?? ''
    })
  }

  async *stream(
    messages: ChatMessage[],
    options?: CompletionOptions
  ): AsyncGenerator<string, void, unknown> {
    if (!this.isAvailable()) throw new Error('Claude: API key missing')
    const res = await fetch(this.endpoint, {
      method: 'POST',
      signal: options?.signal,
      headers: this.headers(),
      body: JSON.stringify(this.buildBody(messages, true)),
    })
    if (!res.ok || !res.body) throw new Error(`Claude: ${await this.parseErrorResponse(res)}`)

    yield* readSSEStream(res.body, (json) => (json as AnthropicSSEEvent).delta?.text)
  }
}
