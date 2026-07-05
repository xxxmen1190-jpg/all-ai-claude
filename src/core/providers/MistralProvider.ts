import { OpenAICompatBase } from './OpenAICompatBase'
import type { ProviderKey } from '../../types'

export class MistralProvider extends OpenAICompatBase {
  readonly key: ProviderKey = 'mistral'
  readonly displayName = 'Mistral'
  protected readonly endpoint = 'https://api.mistral.ai/v1/chat/completions'
  protected readonly model = 'mistral-large-latest'
}
