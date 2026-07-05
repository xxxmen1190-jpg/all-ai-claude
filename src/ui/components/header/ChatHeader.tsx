import { Menu, Sun, Moon, Monitor, Sparkles, Paperclip, BookOpen } from 'lucide-react'
import { useUIStore } from '../../store/uiStore'
import { useSettingsStore } from '../../store/settingsStore'
import { ModelSelector } from '../model-selector/ModelSelector'
import type { ProviderKey, Theme } from '../../../types'

interface Props {
  title: string
  availableProviders: ProviderKey[]
  agentMode: boolean
  onToggleAgentMode: () => void
  ragMode: boolean
  documentCount: number
  onOpenFileManager: () => void
}

const THEME_ICONS: Record<Theme, typeof Sun> = { dark: Moon, light: Sun, system: Monitor }

export function ChatHeader({ title, availableProviders, agentMode, onToggleAgentMode, ragMode, documentCount, onOpenFileManager }: Props) {
  const { toggleSidebar, sidebarOpen } = useUIStore()
  const { theme, setTheme } = useSettingsStore()

  function cycleTheme() {
    const order: Theme[] = ['dark', 'light', 'system']
    setTheme(order[(order.indexOf(theme) + 1) % order.length])
  }

  const ThemeIcon = THEME_ICONS[theme]

  return (
    <header className="flex items-center gap-2 px-3 sm:px-4 py-2.5 border-b border-border bg-card flex-shrink-0">
      {!sidebarOpen && (
        <button onClick={toggleSidebar} className="p-2 rounded-lg hover:bg-secondary text-muted-foreground">
          <Menu size={17} />
        </button>
      )}

      <div className="flex-1 min-w-0">
        <h1 className="text-sm font-semibold truncate">{title}</h1>
      </div>

      <button onClick={onOpenFileManager}
        className={`flex items-center gap-1 text-xs rounded-lg px-2.5 py-1.5 relative ${ragMode ? 'bg-primary/20 text-primary' : 'bg-secondary text-muted-foreground hover:bg-muted'}`}
        title="ניהול מסמכים"
      >
        {ragMode ? <BookOpen size={13} /> : <Paperclip size={13} />}
        <span className="hidden sm:inline">{ragMode ? 'מסמכים' : 'קבצים'}</span>
        {documentCount > 0 && (
          <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-primary text-primary-foreground text-[9px] flex items-center justify-center">
            {documentCount}
          </span>
        )}
      </button>

      <button onClick={onToggleAgentMode}
        className={`flex items-center gap-1 text-xs rounded-lg px-2.5 py-1.5 ${agentMode ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground hover:bg-muted'}`}
        title="מצב Agent"
      >
        <Sparkles size={13} /> Agent
      </button>

      <ModelSelector availableProviders={availableProviders} />

      <button onClick={cycleTheme} className="p-2 rounded-lg hover:bg-secondary text-muted-foreground" title="שנה ערכת נושא">
        <ThemeIcon size={16} />
      </button>
    </header>
  )
}
