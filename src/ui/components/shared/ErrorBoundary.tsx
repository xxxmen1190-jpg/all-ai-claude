import { Component, type ReactNode } from 'react'
import { Logger } from '../../../core/logging/Logger'

interface Props {
  children: ReactNode
  /** Shown instead of the error UI when provided */
  fallback?: ReactNode
  /** Compact version for inline use (e.g. inside a message bubble) */
  compact?: boolean
  /** Section label for logging */
  section?: string
}

interface State {
  hasError: boolean
  error?: Error
}

/**
 * Granular error boundary — wrap any sub-tree that should recover
 * independently (chat window, sidebar, settings, file manager, agent progress).
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: { componentStack: string }) {
    Logger.error('ErrorBoundary', `[${this.props.section ?? 'unknown'}] ${error.message}`, {
      stack: error.stack,
      component: info.componentStack.slice(0, 200),
    })
  }

  reset = () => this.setState({ hasError: false, error: undefined })

  render() {
    if (!this.state.hasError) return this.props.children

    if (this.props.fallback) return this.props.fallback

    if (this.props.compact) {
      return (
        <div className="flex items-center gap-2 text-xs text-destructive p-2 bg-destructive/10 rounded-lg border border-destructive/20">
          <span>⚠️ שגיאה בטעינת הרכיב</span>
          <button onClick={this.reset} className="underline hover:no-underline">נסה שוב</button>
        </div>
      )
    }

    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 p-8 text-center">
        <div className="text-5xl">⚠️</div>
        <h2 className="text-lg font-semibold">משהו השתבש</h2>
        <p className="text-sm text-muted-foreground max-w-xs">{this.state.error?.message}</p>
        <button
          onClick={this.reset}
          className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-lg hover:opacity-90"
        >
          נסה שוב
        </button>
      </div>
    )
  }
}
