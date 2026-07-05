import { OpenAICompatBase } from './OpenAICompatBase'
import type { ProviderKey } from '../../types'

export class DeepSeekProvider extends OpenAICompatBase {
  readonly key: ProviderKey = 'deepseek'
  readonly displayName = 'DeepSeek'
  protected readonly endpoint = 'https://api.deepseek.com/chat/completions'
  protected readonly model = 'deepseek-chat'
}
