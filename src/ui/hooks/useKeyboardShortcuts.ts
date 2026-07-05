import { useEffect } from 'react'
import { useChatStore } from '../store/chatStore'
import { useUIStore } from '../store/uiStore'

/**
 * Global keyboard shortcuts.
 * Skipped when focus is on an input/textarea to avoid interfering with typing.
 */
export function useKeyboardShortcuts() {
  const createConversation = useChatStore((s) => s.createConversation)
  const { toggleSidebar, toggleSettings } = useUIStore()

  useEffect(() => {
    function handler(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement).tagName
      const isTyping = tag === 'INPUT' || tag === 'TEXTAREA' || (e.target as HTMLElement).isContentEditable
      const ctrl = e.ctrlKey || e.metaKey

      // Always allow Escape regardless of focus
      if (e.key === 'Escape') {
        // Let individual components handle Escape via their own listeners
        return
      }

      if (isTyping) return

      if (ctrl && e.key === 'k') {
        e.preventDefault()
        createConversation()
      }

      if (ctrl && e.key === 'b') {
        e.preventDefault()
        toggleSidebar()
      }

      if (ctrl && e.key === ',') {
        e.preventDefault()
        toggleSettings()
      }
    }

    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [createConversation, toggleSidebar, toggleSettings])
}
