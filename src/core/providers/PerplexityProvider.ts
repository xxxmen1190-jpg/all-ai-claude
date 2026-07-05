import { OpenAICompatBase } from './OpenAICompatBase'
import type { ProviderKey } from '../../types'

export class PerplexityProvider extends OpenAICompatBase {
  readonly key: ProviderKey = 'perplexity'
  readonly displayName = 'Perplexity'
  protected readonly endpoint = 'https://api.perplexity.ai/chat/completions'
  protected readonly model = 'llama-3.1-sonar-large-128k-online'
}
