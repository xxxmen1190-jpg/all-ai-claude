import { useState, memo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown } from 'lucide-react'
import { useSettingsStore } from '../../store/settingsStore'

interface Props {
  onSelect: (content: string) => void
}

/**
 * Compact dropdown that lists all saved prompt templates.
 * Selecting one fills the input bar with the template content.
 */
export const TemplatesPicker = memo(function TemplatesPicker({ onSelect }: Props) {
  const templates = useSettingsStore((s) => s.templates)
  const [open, setOpen] = useState(false)

  if (templates.length === 0) return null

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground bg-secondary border border-border rounded-lg px-2.5 py-1.5 transition-colors"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label="בחר תבנית prompt"
        title="תבניות"
      >
        📝
        <ChevronDown size={11} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {open && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: 4, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 4, scale: 0.97 }}
              transition={{ duration: 0.12 }}
              role="listbox"
              aria-label="תבניות prompt"
              className="absolute bottom-full mb-2 left-0 z-20 w-64 bg-card border border-border rounded-xl shadow-xl overflow-hidden"
            >
              <div className="px-3 py-2 border-b border-border">
                <p className="text-[10px] text-muted-foreground font-medium">תבניות Prompt</p>
              </div>
              <div className="max-h-52 overflow-y-auto">
                {templates.map((t) => (
                  <button
                    key={t.id}
                    role="option"
                    aria-selected={false}
                    onClick={() => {
                      onSelect(t.content)
                      setOpen(false)
                    }}
                    className="w-full flex items-start gap-2.5 px-3 py-2.5 hover:bg-secondary text-right transition-colors"
                  >
                    <span className="text-base flex-shrink-0">{t.icon}</span>
                    <div className="min-w-0">
                      <div className="text-xs font-medium truncate">{t.name}</div>
                      <div className="text-[10px] text-muted-foreground line-clamp-1">{t.description || t.content.slice(0, 50)}</div>
                    </div>
                  </button>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
})
