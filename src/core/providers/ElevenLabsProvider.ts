import { BaseProvider, type ChatMessage, type CompletionOptions, type VoiceGenResult } from './BaseProvider'
import type { ProviderKey } from '../../types'

export class ElevenLabsProvider extends BaseProvider {
  readonly key: ProviderKey = 'elevenlabs'
  readonly displayName = 'ElevenLabs'
  readonly supportsStreaming = false
  readonly supportsImageGen = false
  readonly supportsVoiceGen = true

  private readonly voiceId = '21m00Tcm4TlvDq8ikWAM'
  private readonly objectUrls: string[] = []

  async complete(_messages: ChatMessage[]): Promise<string> {
    throw new Error('ElevenLabs does not support text completion — use generateVoice() instead')
  }

  // eslint-disable-next-line require-yield
  async *stream(_messages: ChatMessage[]): AsyncGenerator<string, void, unknown> {
    throw new Error('ElevenLabs does not support streaming text')
  }

  async generateVoice(text: string, options?: CompletionOptions): Promise<VoiceGenResult> {
    if (!this.isAvailable()) throw new Error('ElevenLabs: API key missing')
    return this.withRetryAndTimeout(async (signal) => {
      const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${this.voiceId}`, {
        method: 'POST',
        signal: options?.signal ?? signal,
        headers: { 'Content-Type': 'application/json', 'xi-api-key': this.apiKey },
        body: JSON.stringify({
          text,
          model_id: 'eleven_multilingual_v2',
          voice_settings: { stability: 0.5, similarity_boost: 0.75 },
        }),
      })
      if (!res.ok) throw new Error(`ElevenLabs: ${await this.parseErrorResponse(res)}`)
      const blob = await res.blob()
      const audioUrl = URL.createObjectURL(blob)
      // Track URL so it can be revoked when the provider is rebuilt
      this.objectUrls.push(audioUrl)
      return { audioUrl }
    })
  }

  /** Call when this provider instance is being discarded to free blob memory. */
  dispose(): void {
    for (const url of this.objectUrls) URL.revokeObjectURL(url)
    this.objectUrls.length = 0
  }
}
