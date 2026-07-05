import { BaseProvider, readSSEStream, type ChatMessage, type CompletionOptions, type ImageGenResult } from './BaseProvider'
import type { ProviderKey } from '../../types'

interface OpenAISSEChunk {
  choices?: { delta?: { content?: string } }[]
}

export class OpenAIProvider extends BaseProvider {
  readonly key: ProviderKey = 'gpt'
  readonly displayName = 'GPT-4o'
  readonly supportsStreaming = true
  readonly supportsImageGen = true
  readonly supportsVoiceGen = false

  private readonly model = 'gpt-4o'
  private readonly chatEndpoint = 'https://api.openai.com/v1/chat/completions'
  private readonly imageEndpoint = 'https://api.openai.com/v1/images/generations'

  private headers() {
    return { 'Content-Type': 'application/json', Authorization: `Bearer ${this.apiKey}` }
  }

  private buildBody(messages: ChatMessage[], stream: boolean) {
    return { model: this.model, stream, messages: messages.map((m) => ({ role: m.role, content: m.content })) }
  }

  async complete(messages: ChatMessage[], options?: CompletionOptions): Promise<string> {
    if (!this.isAvailable()) throw new Error('GPT-4o: API key missing')
    return this.withRetryAndTimeout(async (signal) => {
      const res = await fetch(this.chatEndpoint, {
        method: 'POST',
        signal: options?.signal ?? signal,
        headers: this.headers(),
        body: JSON.stringify(this.buildBody(messages, false)),
      })
      if (!res.ok) throw new Error(`GPT-4o: ${await this.parseErrorResponse(res)}`)
      const data = await res.json()
      return data.choices?.[0]?.message?.content ?? ''
    })
  }

  async *stream(
    messages: ChatMessage[],
    options?: CompletionOptions
  ): AsyncGenerator<string, void, unknown> {
    if (!this.isAvailable()) throw new Error('GPT-4o: API key missing')
    const res = await fetch(this.chatEndpoint, {
      method: 'POST',
      signal: options?.signal,
      headers: this.headers(),
      body: JSON.stringify(this.buildBody(messages, true)),
    })
    if (!res.ok || !res.body) throw new Error(`GPT-4o: ${await this.parseErrorResponse(res)}`)

    yield* readSSEStream(res.body, (json) => (json as OpenAISSEChunk).choices?.[0]?.delta?.content)
  }

  async generateImage(prompt: string, options?: CompletionOptions): Promise<ImageGenResult> {
    if (!this.isAvailable()) throw new Error('GPT-4o: API key missing (required for DALL-E)')
    return this.withRetryAndTimeout(async (signal) => {
      const res = await fetch(this.imageEndpoint, {
        method: 'POST',
        signal: options?.signal ?? signal,
        headers: this.headers(),
        body: JSON.stringify({ model: 'dall-e-3', prompt, n: 1, size: '1024x1024' }),
      })
      if (!res.ok) throw new Error(`DALL-E: ${await this.parseErrorResponse(res)}`)
      const data = await res.json()
      const url = data.data?.[0]?.url
      if (!url) throw new Error('DALL-E: no image URL returned')
      return { url }
    })
  }
}
