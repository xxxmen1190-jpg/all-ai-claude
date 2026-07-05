import { OpenAICompatBase } from './OpenAICompatBase'
import type { ProviderKey } from '../../types'

export class OpenRouterProvider extends OpenAICompatBase {
  readonly key: ProviderKey = 'openrouter'
  readonly displayName = 'OpenRouter'
  protected readonly endpoint = 'https://openrouter.ai/api/v1/chat/completions'
  protected readonly model = 'meta-llama/llama-3.3-70b-instruct:free'

  protected headers(): Record<string, string> {
    return {
      ...super.headers(),
      'HTTP-Referer': window.location.origin,
      'X-Title': 'AI Orchestrator',
    }
  }
}
