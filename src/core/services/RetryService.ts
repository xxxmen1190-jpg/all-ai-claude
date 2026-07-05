import { sleep } from '../../lib/utils'

interface RetryOptions {
  maxRetries?: number
  baseDelayMs?: number
  shouldRetry?: (error: unknown) => boolean
}

export async function withRetry<T>(
  fn: (signal: AbortSignal) => Promise<T>,
  options: RetryOptions = {},
  timeoutMs = 30_000
): Promise<T> {
  const { maxRetries = 2, baseDelayMs = 600, shouldRetry = () => true } = options
  let lastError: unknown

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), timeoutMs)
    try {
      const result = await fn(controller.signal)
      clearTimeout(timer)
      return result
    } catch (error) {
      clearTimeout(timer)
      lastError = error
      const isAbort = error instanceof Error && error.name === 'AbortError'
      if (isAbort) {
        lastError = new Error(`Request timed out after ${timeoutMs}ms`)
      }
      if (attempt < maxRetries && shouldRetry(error)) {
        await sleep(baseDelayMs * Math.pow(2, attempt))
        continue
      }
      throw lastError
    }
  }
  throw lastError
}
