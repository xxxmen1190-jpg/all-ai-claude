import type { ProviderKey } from '../../../types'
import { PROVIDER_META } from '../../../lib/constants'

interface Props {
  providerKey: ProviderKey
  isFallback?: boolean
  intent?: string
}

export function ModelBadge({ providerKey, isFallback }: Props) {
  const meta = PROVIDER_META[providerKey]
  if (!meta) return null
  return (
    <div className="flex items-center gap-1 mb-1">
      <span className="text-xs font-semibold" style={{ color: meta.color }}>
        {meta.emoji} {meta.name}
      </span>
      {isFallback && (
        <span className="text-xs text-muted-foreground">(fallback)</span>
      )}
    </div>
  )
}
