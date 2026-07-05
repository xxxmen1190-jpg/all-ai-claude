import type { AnalyticsEvent, AnalyticsSummary } from '../../types'
import { Logger } from '../logging/Logger'

const STORAGE_KEY = 'aio_analytics_v1'
const MAX_EVENTS = 1000

class AnalyticsServiceImpl {
  private events: AnalyticsEvent[] = []
  private loaded = false

  private load(): void {
    if (this.loaded) return
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      this.events = raw ? JSON.parse(raw) : []
    } catch {
      this.events = []
    }
    this.loaded = true
  }

  private save(): void {
    try {
      if (this.events.length > MAX_EVENTS) {
        this.events = this.events.slice(-MAX_EVENTS)
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.events))
    } catch {
      // Quota exceeded — trim aggressively
      this.events = this.events.slice(-100)
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(this.events)) } catch { /* ignore */ }
    }
  }

  track(event: Omit<AnalyticsEvent, 'timestamp'>): void {
    this.load()
    this.events.push({ ...event, timestamp: Date.now() })
    this.save()
    Logger.info('Analytics', event.type, { provider: event.provider, success: event.success })
  }

  getSummary(days = 30): AnalyticsSummary {
    this.load()
    const cutoff = Date.now() - days * 24 * 60 * 60 * 1000
    const recent = this.events.filter((e) => e.timestamp >= cutoff)

    const messagesSent = recent.filter((e) => e.type === 'message_sent')
    const byProvider: Record<string, number> = {}
    for (const e of messagesSent) {
      if (e.provider) byProvider[e.provider] = (byProvider[e.provider] ?? 0) + 1
    }

    const successCount = recent.filter((e) => e.success).length
    const favoriteProvider =
      Object.entries(byProvider).sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'claude'

    return {
      totalMessages: messagesSent.length,
      messagesByProvider: byProvider,
      successRate: recent.length > 0 ? Math.round((successCount / recent.length) * 100) : 100,
      agentRuns: recent.filter((e) => e.type === 'agent_run').length,
      documentsUploaded: recent.filter((e) => e.type === 'document_uploaded').length,
      favoriteProvider,
      periodDays: days,
    }
  }

  clear(): void {
    this.events = []
    localStorage.removeItem(STORAGE_KEY)
  }
}

export const AnalyticsService = new AnalyticsServiceImpl()
