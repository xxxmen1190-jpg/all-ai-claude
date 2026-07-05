import { RATE_LIMIT } from '../../lib/constants'

interface Bucket { count: number; resetAt: number }

class RateLimitServiceImpl {
  private buckets = new Map<string, Bucket>()

  check(key: string): boolean {
    const now = Date.now()
    const bucket = this.buckets.get(key)

    if (!bucket || now > bucket.resetAt) {
      this.buckets.set(key, { count: 1, resetAt: now + RATE_LIMIT.WINDOW_MS })
      return true
    }

    if (bucket.count >= RATE_LIMIT.MAX_REQUESTS_PER_MINUTE) {
      return false
    }

    bucket.count += 1
    return true
  }

  getRemaining(key: string): number {
    const bucket = this.buckets.get(key)
    if (!bucket || Date.now() > bucket.resetAt) return RATE_LIMIT.MAX_REQUESTS_PER_MINUTE
    return Math.max(0, RATE_LIMIT.MAX_REQUESTS_PER_MINUTE - bucket.count)
  }

  reset(key: string): void {
    this.buckets.delete(key)
  }
}

export const RateLimitService = new RateLimitServiceImpl()
