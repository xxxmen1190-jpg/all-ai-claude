import { OpenAICompatBase } from './OpenAICompatBase'
import type { ProviderKey } from '../../types'

export class GroqProvider extends OpenAICompatBase {
  readonly key: ProviderKey = 'groq'
  readonly displayName = 'Groq'
  protected readonly endpoint = 'https://api.groq.com/openai/v1/chat/completions'
  protected readonly model = 'llama-3.3-70b-versatile'
}
