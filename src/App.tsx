import { lazy, Suspense } from 'react'
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AppShell } from './ui/components/AppShell'
import { ThemeProvider } from './ui/components/ThemeProvider'
import { InstallPrompt } from './ui/components/pwa/InstallPrompt'
import { useKeyboardShortcuts } from './ui/hooks/useKeyboardShortcuts'

const ChatPage = lazy(() =>
  import('./pages/ChatPage').then((m) => ({ default: m.ChatPage }))
)

function PageSpinner() {
  return (
    <div className="flex h-full items-center justify-center" aria-label="טוען...">
      <div className="flex gap-1.5" role="status">
        <span className="sr-only">טוען</span>
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="w-2 h-2 rounded-full bg-primary animate-bounce"
            style={{ animationDelay: `${i * 0.15}s` }}
          />
        ))}
      </div>
    </div>
  )
}

function AppInner() {
  useKeyboardShortcuts()
  return (
    <HashRouter>
      <Suspense fallback={<PageSpinner />}>
        <Routes>
          <Route path="/" element={<ChatPage />} />
          <Route path="/c/:conversationId" element={<ChatPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </HashRouter>
  )
}

export default function App() {
  return (
    <ThemeProvider>
      <AppShell>
        <AppInner />
        <InstallPrompt />
      </AppShell>
    </ThemeProvider>
  )
}
