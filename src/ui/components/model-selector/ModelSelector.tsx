import { useSettingsStore } from '../../store/settingsStore'
import { PROVIDER_META } from '../../../lib/constants'
import type { ModelSelection, ProviderKey } from '../../../types'

interface Props {
  availableProviders: ProviderKey[]
}

/**
 * Auto / Manual model selector. Auto mode lets AIRouter pick per-message.
 * Manual mode pins every message to one provider until changed.
 */
export function ModelSelector({ availableProviders }: Props) {
  const model = useSettingsStore((s) => s.model)
  const setModel = useSettingsStore((s) => s.setModel)

  const isAvailable = (key: ProviderKey) => key === 'claude' || availableProviders.includes(key)

  return (
    <select
      value={model}
      onChange={(e) => setModel(e.target.value as ModelSelection)}
      className="bg-secondary border border-border rounded-lg text-foreground px-2.5 py-1.5 text-xs cursor-pointer outline-none focus:ring-1 focus:ring-ring"
    >
      <option value="auto">🤖 Auto</option>
      {(Object.entries(PROVIDER_META) as [ProviderKey, (typeof PROVIDER_META)[ProviderKey]][]).map(
        ([key, meta]) => (
          <option key={key} value={key} disabled={!isAvailable(key)}>
            {meta.emoji} {meta.name} {!isAvailable(key) ? '(ללא מפתח)' : ''}
          </option>
        )
      )}
    </select>
  )
}
