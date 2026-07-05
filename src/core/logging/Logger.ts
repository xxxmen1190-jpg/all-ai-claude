type LogLevel = 'info' | 'warn' | 'error'

export interface LogEntry {
  level: LogLevel
  scope: string
  message: string
  timestamp: number
  meta?: Record<string, unknown>
}

/**
 * Minimal structured logger. Keeps an in-memory ring buffer (useful for
 * a future "debug panel" or audit view) and mirrors to console.
 */
class LoggerImpl {
  private buffer: LogEntry[] = []
  private readonly maxEntries = 200

  private push(level: LogLevel, scope: string, message: string, meta?: Record<string, unknown>) {
    const entry: LogEntry = { level, scope, message, timestamp: Date.now(), meta }
    this.buffer.push(entry)
    if (this.buffer.length > this.maxEntries) this.buffer.shift()

    const consoleFn = level === 'error' ? console.error : level === 'warn' ? console.warn : console.info
    consoleFn(`[${scope}] ${message}`, meta ?? '')
  }

  info(scope: string, message: string, meta?: Record<string, unknown>) {
    this.push('info', scope, message, meta)
  }

  warn(scope: string, message: string, meta?: Record<string, unknown>) {
    this.push('warn', scope, message, meta)
  }

  error(scope: string, message: string, meta?: Record<string, unknown>) {
    this.push('error', scope, message, meta)
  }

  getRecent(count = 50): LogEntry[] {
    return this.buffer.slice(-count)
  }

  clear() {
    this.buffer = []
  }
}

export const Logger = new LoggerImpl()
