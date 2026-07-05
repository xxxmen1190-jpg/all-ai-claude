import { useMemo, useRef } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Plus, Search, Settings, PanelLeftClose, Download, Upload } from 'lucide-react'
import { useChatStore } from '../../store/chatStore'
import { useUIStore } from '../../store/uiStore'
import { ConversationItem } from './ConversationItem'
import { ErrorBoundary } from '../shared/ErrorBoundary'
import { ExportService } from '../../../core/services/ExportService'
import { cn } from '../../../lib/utils'
import toast from 'react-hot-toast'

export function Sidebar() {
  const {
    conversations, activeConversationId,
    createConversation, renameConversation, deleteConversation,
    setActiveConversation,
  } = useChatStore()

  const { sidebarOpen, setSidebarOpen, toggleSidebar, searchQuery, setSearchQuery, toggleSettings } = useUIStore()
  const importRef = useRef<HTMLInputElement>(null)

  const filtered = useMemo(() => {
    if (!searchQuery.trim()) return conversations
    const q = searchQuery.toLowerCase()
    return conversations.filter(
      (c) =>
        c.title.toLowerCase().includes(q) ||
        c.messages.some((m) => m.content.toLowerCase().includes(q))
    )
  }, [conversations, searchQuery])

  function handleExport() {
    if (conversations.length === 0) { toast('אין שיחות לייצוא'); return }
    ExportService.export(conversations)
    toast.success(`${conversations.length} שיחות יוצאו`)
  }

  async function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const imported = await ExportService.import(file)
      const store = useChatStore.getState()
      for (const conv of imported) {
        if (!store.conversations.find((c) => c.id === conv.id)) {
          useChatStore.setState((s) => ({ conversations: [...s.conversations, conv] }))
        }
      }
      toast.success(`${imported.length} שיחות יובאו`)
    } catch (err) {
      toast.error(`ייבוא נכשל: ${(err as Error).message}`)
    }
    e.target.value = ''
  }

  return (
    <>
      {/* Mobile overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 bg-black/50 z-30 md:hidden"
          />
        )}
      </AnimatePresence>

      <AnimatePresence initial={false}>
        {sidebarOpen && (
          <motion.aside
            initial={{ x: 280 }}
            animate={{ x: 0 }}
            exit={{ x: 280 }}
            transition={{ type: 'tween', duration: 0.2 }}
            className={cn('fixed md:relative z-40 h-full w-[260px] bg-card border-l border-border flex flex-col flex-shrink-0')}
          >
            {/* Header */}
            <div className="p-3 border-b border-border flex items-center gap-2">
              <button
                onClick={createConversation}
                className="flex-1 flex items-center justify-center gap-2 bg-primary text-primary-foreground rounded-lg py-2 text-sm font-semibold hover:opacity-90 transition-opacity"
              >
                <Plus size={15} /> שיחה חדשה
              </button>
              <button
                onClick={toggleSidebar}
                className="p-2 rounded-lg hover:bg-secondary text-muted-foreground"
                title="סגור סרגל צד"
              >
                <PanelLeftClose size={16} />
              </button>
            </div>

            {/* Search */}
            <div className="px-3 pt-3">
              <div className="relative">
                <Search size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                <input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="חיפוש שיחות..."
                  className="w-full bg-secondary border border-border rounded-lg pr-8 pl-2 py-1.5 text-xs outline-none focus:ring-1 focus:ring-ring"
                />
              </div>
            </div>

            {/* Conversation list */}
            <div className="flex-1 overflow-y-auto px-2 py-3 space-y-1">
              <ErrorBoundary compact section="sidebar-list">
                <AnimatePresence>
                  {filtered.length === 0 && (
                    <p className="text-xs text-muted-foreground text-center mt-6">
                      {searchQuery ? 'לא נמצאו שיחות' : 'אין שיחות עדיין'}
                    </p>
                  )}
                  {filtered.map((c) => (
                    <ConversationItem
                      key={c.id}
                      conversation={c}
                      isActive={c.id === activeConversationId}
                      onSelect={() => {
                        setActiveConversation(c.id)
                        if (window.innerWidth < 768) setSidebarOpen(false)
                      }}
                      onRename={(title) => renameConversation(c.id, title)}
                      onDelete={() => deleteConversation(c.id)}
                    />
                  ))}
                </AnimatePresence>
              </ErrorBoundary>
            </div>

            {/* Footer */}
            <div className="p-3 border-t border-border space-y-1">
              {/* Export / Import */}
              <div className="flex gap-1">
                <button
                  onClick={handleExport}
                  className="flex-1 flex items-center justify-center gap-1.5 text-xs text-muted-foreground hover:text-foreground rounded-lg px-2 py-1.5 hover:bg-secondary transition-colors"
                  title="ייצוא שיחות"
                >
                  <Download size={12} /> ייצוא
                </button>
                <button
                  onClick={() => importRef.current?.click()}
                  className="flex-1 flex items-center justify-center gap-1.5 text-xs text-muted-foreground hover:text-foreground rounded-lg px-2 py-1.5 hover:bg-secondary transition-colors"
                  title="ייבוא שיחות"
                >
                  <Upload size={12} /> ייבוא
                </button>
                <input ref={importRef} type="file" accept=".json" className="hidden" onChange={handleImport} />
              </div>

              <button
                onClick={toggleSettings}
                className="w-full flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground rounded-lg px-2.5 py-2 hover:bg-secondary transition-colors"
              >
                <Settings size={15} /> הגדרות
              </button>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>
    </>
  )
}
