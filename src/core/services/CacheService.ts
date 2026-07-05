import type { CacheEntry } from '../../types'
import { STORAGE_KEYS, CACHE_TTL } from '../../lib/constants'
import { hashString } from '../../lib/utils'
import { Logger } from '../logging/Logger'

const MAX_ENTRIES = 150
const MAX_STORAGE_BYTES = 4 * 1024 * 1024   // 4 MB localStorage budget for cache

class CacheServiceImpl {
  /**
   * Two-level cache: L1 = in-memory Map (fast, session-scoped),
   * L2 = localStorage (persists across reloads, slower).
   * LRU eviction on L2 when MAX_ENTRIES or size budget is exceeded.
   */
  private l1 = new Map<string, CacheEntry>()

  private loadL2(): Record<string, CacheEntry> {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.CACHE)
      return raw ? (JSON.parse(raw) as Record<string, CacheEntry>) : {}
    } catch {
      return {}
    }
  }

  private saveL2(data: Record<string, CacheEntry>): void {
    try {
      const json = JSON.stringify(data)
      if (json.length > MAX_STORAGE_BYTES) {
        // Evict oldest 25% to make room (LRU-by-timestamp)
        const sorted = Object.entries(data).sort((a, b) => a[1].timestamp - b[1].timestamp)
        const trimmed = Object.fromEntries(sorted.slice(Math.floor(sorted.length * 0.25)))
        localStorage.setItem(STORAGE_KEYS.CACHE, JSON.stringify(trimmed))
        Logger.info('CacheService', 'L2 eviction (size limit)', { removed: Math.floor(sorted.length * 0.25) })
      } else {
        localStorage.setItem(STORAGE_KEYS.CACHE, json)
      }
    } catch {
      // Quota exceeded — clear cache entirely rather than crashing
      localStorage.removeItem(STORAGE_KEYS.CACHE)
      Logger.warn('CacheService', 'localStorage quota exceeded — cache cleared')
    }
  }

  makeKey(provider: string, messages: { role: string; content: string }[]): string {
    const serialized = messages.map((m) => `${m.role}:${m.content}`).join('|')
    return `${provider}:${hashString(serialized)}`
  }

  get(key: string): string | null {
    const now = Date.now()

    // L1 hit
    const mem = this.l1.get(key)
    if (mem) {
      if (now < mem.timestamp + mem.ttl) return mem.result
      this.l1.delete(key)
    }

    // L2 hit
    const stored = this.loadL2()
    const entry = stored[key]
    if (entry && now < entry.timestamp + entry.ttl) {
      this.l1.set(key, entry)  // promote to L1
      return entry.result
    }
    return null
  }

  set(key: string, result: string, ttl: number = CACHE_TTL.MEDIUM): void {
    const entry: CacheEntry = { result, timestamp: Date.now(), ttl }
    this.l1.set(key, entry)

    const stored = this.loadL2()
    stored[key] = entry

    const entries = Object.entries(stored)
    if (entries.length > MAX_ENTRIES) {
      const sorted = entries.sort((a, b) => a[1].timestamp - b[1].timestamp)
      const trimmed = Object.fromEntries(sorted.slice(-MAX_ENTRIES))
      this.saveL2(trimmed)
      Logger.info('CacheService', 'L2 eviction (count limit)', { total: entries.length })
    } else {
      this.saveL2(stored)
    }
  }

  clear(): void {
    this.l1.clear()
    localStorage.removeItem(STORAGE_KEYS.CACHE)
    Logger.info('CacheService', 'cache cleared')
  }

  stats(): { l1Size: number; l2Size: number } {
    return {
      l1Size: this.l1.size,
      l2Size: Object.keys(this.loadL2()).length,
    }
  }
}

export const CacheService = new CacheServiceImpl()
