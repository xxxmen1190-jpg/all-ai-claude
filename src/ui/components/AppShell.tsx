import { type ReactNode, memo } from 'react'
import { Toaster } from 'react-hot-toast'
import { ErrorBoundary } from './shared/ErrorBoundary'

interface Props { children: ReactNode }

/**
 * Root app shell — top-level error boundary + toast container.
 * Memoized so rerenders from stores don't cascade here unnecessarily.
 */
export const AppShell = memo(function AppShell({ children }: Props) {
  return (
    <ErrorBoundary section="app-shell">
      <div className="h-screen w-screen overflow-hidden bg-background text-foreground antialiased">
        {children}
        <Toaster
          position="top-center"
          toastOptions={{
            duration: 3000,
            style: {
              background: 'hsl(var(--card))',
              color: 'hsl(var(--foreground))',
              border: '1px solid hsl(var(--border))',
              fontSize: '13px',
              borderRadius: '10px',
            },
          }}
        />
      </div>
    </ErrorBoundary>
  )
})
