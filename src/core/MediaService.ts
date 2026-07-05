import type { ApiKeys } from '../types'
import { ProviderRegistry } from './providers/ProviderRegistry'
import { Logger } from './logging/Logger'

export interface ImageResult {
  url: string
}

export interface VoiceResult {
  audioUrl: string
}

/**
 * Thin service for non-text generation (images, voice) that the
 * AIService delegates to when intent === 'image' | 'voice'.
 * Kept separate from AIService because these don't participate
 * in streaming/conversation context the same way text completions do.
 */
export class MediaService {
  private registry: ProviderRegistry

  constructor(apiKeys: ApiKeys) {
    this.registry = new ProviderRegistry(apiKeys)
  }

  updateApiKeys(apiKeys: ApiKeys): void {
    this.registry.rebuild(apiKeys)
  }

  async generateImage(prompt: string, signal?: AbortSignal): Promise<ImageResult> {
    const provider = this.registry.get('dalle')
    if (!provider.generateImage) throw new Error('DALL-E: provider does not support image generation')
    if (!provider.isAvailable()) throw new Error('DALL-E: API key missing (uses OpenAI key)')
    try {
      const result = await provider.generateImage(prompt, { signal })
      Logger.info('MediaService', 'image generated')
      return result
    } catch (error) {
      Logger.error('MediaService', 'image generation failed', { error: (error as Error).message })
      throw error
    }
  }

  async generateVoice(text: string, signal?: AbortSignal): Promise<VoiceResult> {
    const provider = this.registry.get('elevenlabs')
    if (!provider.generateVoice) throw new Error('ElevenLabs: provider does not support voice generation')
    if (!provider.isAvailable()) throw new Error('ElevenLabs: API key missing')
    try {
      const result = await provider.generateVoice(text, { signal })
      Logger.info('MediaService', 'voice generated')
      return result
    } catch (error) {
      Logger.error('MediaService', 'voice generation failed', { error: (error as Error).message })
      throw error
    }
  }
}
