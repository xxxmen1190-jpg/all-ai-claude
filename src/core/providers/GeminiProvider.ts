import { BaseProvider, readSSEStream, type ChatMessage, type CompletionOptions } from './BaseProvider'
import type { ProviderKey } from '../../types'

interface GeminiSSEChunk {
  candidates?: { content?: { parts?: { text?: string }[] } }[]
}

export class GeminiProvider extends BaseProvider {
  readonly key: ProviderKey = 'gemini'
  readonly displayName = 'Gemini'
  readonly supportsStreaming = true
  readonly supportsImageGen = false
  readonly supportsVoiceGen = false

  private readonly model = 'gemini-1.5-pro'

  private endpoint(stream: boolean): string {
    const method = stream ? 'streamGenerateContent' : 'generateContent'
    const sse = stream ? '&alt=sse' : ''
    return `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:${method}?key=${this.apiKey}${sse}`
  }

  private buildBody(messages: ChatMessage[]) {
    const contents = messages
      .filter((m) => m.role !== 'system')
      .map((m) => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }],
      }))
    const system = messages.find((m) => m.role === 'system')?.content
    return {
      contents,
      ...(system ? { systemInstruction: { parts: [{ text: system }] } } : {}),
    }
  }

  async complete(messages: ChatMessage[], options?: CompletionOptions): Promise<string> {
    if (!this.isAvailable()) throw new Error('Gemini: API key missing')
    return this.withRetryAndTimeout(async (signal) => {
      const res = await fetch(this.endpoint(false), {
        method: 'POST',
        signal: options?.signal ?? signal,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(this.buildBody(messages)),
      })
      if (!res.ok) throw new Error(`Gemini: ${await this.parseErrorResponse(res)}`)
      const data = await res.json()
      return data.candidates?.[0]?.content?.parts?.[0]?.text ?? ''
    })
  }

  async *stream(
    messages: ChatMessage[],
    options?: CompletionOptions
  ): AsyncGenerator<string, void, unknown> {
    if (!this.isAvailable()) throw new Error('Gemini: API key missing')
    const res = await fetch(this.endpoint(true), {
      method: 'POST',
      signal: options?.signal,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(this.buildBody(messages)),
    })
    if (!res.ok || !res.body) throw new Error(`Gemini: ${await this.parseErrorResponse(res)}`)

    yield* readSSEStream(res.body, (json) => (json as GeminiSSEChunk).candidates?.[0]?.content?.parts?.[0]?.text)
  }
}
