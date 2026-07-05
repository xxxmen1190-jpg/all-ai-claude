import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X, Key, Cpu, BookOpen, Users, BarChart2,
  Keyboard, Download, Upload, Trash2, Plus, Check
} from 'lucide-react'
import { useSettingsStore } from '../../store/settingsStore'
import { useUIStore } from '../../store/uiStore'
import { useChatStore } from '../../store/chatStore'
import { AnalyticsService } from '../../../core/services/AnalyticsService'
import { BackupService } from '../../../core/services/BackupService'
import { ExportService } from '../../../core/services/ExportService'
import { PROVIDER_META, DEFAULT_SYSTEM_PROMPT, KEYBOARD_SHORTCUTS } from '../../../lib/constants'
import type { ApiKeys } from '../../../types'
import toast from 'react-hot-toast'

type Tab = 'keys' | 'models' | 'templates' | 'personas' | 'analytics' | 'shortcuts' | 'backup'

const TABS: { id: Tab; label: string; icon: typeof Key }[] = [
  { id: 'keys',      label: 'מפתחות API', icon: Key },
  { id: 'models',    label: 'מודלים',     icon: Cpu },
  { id: 'templates', label: 'תבניות',     icon: BookOpen },
  { id: 'personas',  label: 'פרסונות',    icon: Users },
  { id: 'analytics', label: 'ניתוח',      icon: BarChart2 },
  { id: 'shortcuts', label: 'קיצורים',    icon: Keyboard },
  { id: 'backup',    label: 'גיבוי',      icon: Download },
]

// ── Sub-panels ──────────────────────────────────────────────
function ApiKeysTab() {
  const { apiKeys, setApiKey } = useSettingsStore()
  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground">🔐 המפתחות נשמרים בדפדפן שלך בלבד ולא נשלחים לשום שרת.</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {(Object.entries(PROVIDER_META) as [keyof ApiKeys, (typeof PROVIDER_META)[keyof typeof PROVIDER_META]][]).map(
          ([key, meta]) => (
            <div
              key={key}
              className="bg-secondary rounded-lg p-2.5 border transition-colors"
              style={{ borderColor: apiKeys[key] || key === 'claude' ? meta.color + '55' : 'hsl(var(--border))' }}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-semibold">{meta.emoji} {meta.name}</span>
                {(apiKeys[key] || key === 'claude') && (
                  <span style={{ color: meta.color }} className="text-[10px]">✓</span>
                )}
              </div>
              <p className="text-[10px] text-muted-foreground mb-1.5">{meta.desc}</p>
              {key === 'claude' ? (
                <p className="text-[10px] text-muted-foreground italic">מחובר אוטומטית</p>
              ) : (
                <input
                  type="password"
                  placeholder="API Key..."
                  value={apiKeys[key]}
                  onChange={(e) => setApiKey(key, e.target.value)}
                  aria-label={`מפתח API עבור ${meta.name}`}
                  className="w-full bg-background border border-border rounded-md px-2 py-1 text-[11px] outline-none focus:ring-1 focus:ring-ring"
                />
              )}
            </div>
          )
        )}
      </div>
    </div>
  )
}

function ModelsTab() {
  const { modelPresets, systemPrompt, setSystemPrompt, applyPreset } = useSettingsStore()
  return (
    <div className="space-y-4">
      <div>
        <label className="text-xs text-muted-foreground mb-1.5 block font-medium">System Prompt</label>
        <textarea
          value={systemPrompt}
          onChange={(e) => setSystemPrompt(e.target.value)}
          rows={3}
          placeholder={DEFAULT_SYSTEM_PROMPT}
          aria-label="System prompt"
          className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-xs outline-none resize-none focus:ring-1 focus:ring-ring"
        />
        <button
          onClick={() => setSystemPrompt(DEFAULT_SYSTEM_PROMPT)}
          className="text-[10px] text-muted-foreground hover:text-foreground mt-1"
        >
          אפס לברירת מחדל
        </button>
      </div>

      <div>
        <label className="text-xs text-muted-foreground mb-1.5 block font-medium">Presets מהירים</label>
        <div className="grid grid-cols-2 gap-2">
          {modelPresets.map((preset) => (
            <button
              key={preset.id}
              onClick={() => { applyPreset(preset.id); toast.success(`פרסט "${preset.name}" הוחל`) }}
              className="flex items-start gap-2 bg-secondary border border-border hover:border-primary/50 rounded-lg p-2.5 text-right transition-colors"
              aria-label={`החל פרסט: ${preset.name}`}
            >
              <span className="text-base flex-shrink-0">{preset.icon}</span>
              <div>
                <div className="text-xs font-semibold">{preset.name}</div>
                <div className="text-[10px] text-muted-foreground">{preset.description}</div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

function TemplatesTab() {
  const { templates, addTemplate, deleteTemplate } = useSettingsStore()
  const [creating, setCreating] = useState(false)
  const [name, setName] = useState('')
  const [content, setContent] = useState('')

  function save() {
    if (!name.trim() || !content.trim()) return
    addTemplate({ name, description: '', content, category: 'custom', icon: '📝' })
    setName(''); setContent(''); setCreating(false)
    toast.success('תבנית נוספה')
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">תבניות prompt לשימוש חוזר. השתמש ב-{'{{input}}'} לתוכן משתנה.</p>
        <button
          onClick={() => setCreating(true)}
          className="flex items-center gap-1 text-xs bg-primary text-primary-foreground rounded-lg px-2.5 py-1.5"
          aria-label="הוסף תבנית חדשה"
        >
          <Plus size={11} /> חדשה
        </button>
      </div>

      {creating && (
        <div className="bg-secondary border border-border rounded-lg p-3 space-y-2">
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="שם תבנית" className="w-full bg-background border border-border rounded-md px-2 py-1.5 text-xs outline-none" />
          <textarea value={content} onChange={(e) => setContent(e.target.value)} rows={3} placeholder="תוכן התבנית..." className="w-full bg-background border border-border rounded-md px-2 py-1.5 text-xs outline-none resize-none" />
          <div className="flex gap-2">
            <button onClick={save} className="flex items-center gap-1 text-xs bg-primary text-primary-foreground rounded-md px-2.5 py-1.5"><Check size={11} /> שמור</button>
            <button onClick={() => setCreating(false)} className="text-xs text-muted-foreground hover:text-foreground px-2">ביטול</button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {templates.map((t) => (
          <div key={t.id} className="flex items-start gap-2 bg-secondary border border-border rounded-lg p-2.5 group">
            <span className="text-base flex-shrink-0">{t.icon}</span>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-semibold">{t.name}</div>
              <div className="text-[10px] text-muted-foreground line-clamp-1">{t.content.slice(0, 80)}</div>
            </div>
            <button
              onClick={() => { deleteTemplate(t.id); toast('תבנית הוסרה') }}
              className="hidden group-hover:flex p-1 hover:text-destructive rounded text-muted-foreground"
              aria-label={`מחק תבנית ${t.name}`}
            >
              <Trash2 size={12} />
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}

function PersonasTab() {
  const { personas, activePersonaId, activatePersona, addPersona, deletePersona } = useSettingsStore()
  const [creating, setCreating] = useState(false)
  const [name, setName] = useState('')
  const [prompt, setPrompt] = useState('')

  function save() {
    if (!name.trim() || !prompt.trim()) return
    addPersona({ name, description: '', systemPrompt: prompt, icon: '🤖', color: '#D97706', preferredModel: 'auto' })
    setName(''); setPrompt(''); setCreating(false)
    toast.success('פרסונה נוספה')
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">פרסונות מגדירות את אופי ה-AI לשיחה.</p>
        <button onClick={() => setCreating(true)} className="flex items-center gap-1 text-xs bg-primary text-primary-foreground rounded-lg px-2.5 py-1.5" aria-label="צור פרסונה חדשה">
          <Plus size={11} /> חדשה
        </button>
      </div>

      {creating && (
        <div className="bg-secondary border border-border rounded-lg p-3 space-y-2">
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="שם פרסונה" className="w-full bg-background border border-border rounded-md px-2 py-1.5 text-xs outline-none" />
          <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} rows={3} placeholder="System prompt לפרסונה..." className="w-full bg-background border border-border rounded-md px-2 py-1.5 text-xs outline-none resize-none" />
          <div className="flex gap-2">
            <button onClick={save} className="flex items-center gap-1 text-xs bg-primary text-primary-foreground rounded-md px-2.5 py-1.5"><Check size={11} /> שמור</button>
            <button onClick={() => setCreating(false)} className="text-xs text-muted-foreground px-2">ביטול</button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {personas.map((p) => {
          const isActive = p.id === activePersonaId
          return (
            <div
              key={p.id}
              className="flex items-center gap-3 rounded-lg p-2.5 border cursor-pointer group"
              style={{ background: isActive ? p.color + '15' : undefined, borderColor: isActive ? p.color + '55' : 'hsl(var(--border))' }}
              onClick={() => { activatePersona(isActive ? null : p.id); toast(isActive ? 'פרסונה בוטלה' : `פרסונה "${p.name}" פעילה`) }}
              role="button"
              aria-pressed={isActive}
              aria-label={`${isActive ? 'בטל' : 'הפעל'} פרסונה: ${p.name}`}
            >
              <span className="text-xl">{p.icon}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold">{p.name}</span>
                  {isActive && <span style={{ color: p.color }} className="text-[10px]">● פעיל</span>}
                </div>
                <div className="text-[10px] text-muted-foreground line-clamp-1">{p.systemPrompt.slice(0, 60)}...</div>
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); deletePersona(p.id); toast('פרסונה הוסרה') }}
                className="hidden group-hover:flex p-1 hover:text-destructive rounded text-muted-foreground"
                aria-label={`מחק פרסונה ${p.name}`}
              >
                <Trash2 size={12} />
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function AnalyticsTab() {
  const summary = AnalyticsService.getSummary(30)
  const providerMeta = PROVIDER_META as Record<string, { name: string; emoji: string; color: string }>
  return (
    <div className="space-y-4">
      <p className="text-xs text-muted-foreground">נתונים מקומיים בלבד — 30 ימים אחרונים</p>
      <div className="grid grid-cols-2 gap-2.5">
        {[
          { label: 'הודעות', value: summary.totalMessages, icon: '💬' },
          { label: 'שיעור הצלחה', value: `${summary.successRate}%`, icon: '✅' },
          { label: 'הרצות Agent', value: summary.agentRuns, icon: '✨' },
          { label: 'מסמכים', value: summary.documentsUploaded, icon: '📄' },
        ].map((s) => (
          <div key={s.label} className="bg-secondary rounded-lg p-3 border border-border">
            <div className="text-lg">{s.icon}</div>
            <div className="text-lg font-bold mt-1">{s.value}</div>
            <div className="text-[10px] text-muted-foreground">{s.label}</div>
          </div>
        ))}
      </div>

      {Object.keys(summary.messagesByProvider).length > 0 && (
        <div>
          <p className="text-xs font-medium mb-2">שימוש לפי ספק:</p>
          <div className="space-y-1.5">
            {Object.entries(summary.messagesByProvider)
              .sort((a, b) => b[1] - a[1])
              .map(([pk, count]) => {
                const meta = providerMeta[pk]
                const total = summary.totalMessages || 1
                return (
                  <div key={pk} className="flex items-center gap-2">
                    <span className="text-xs w-20 flex-shrink-0 text-muted-foreground">{meta?.emoji} {meta?.name ?? pk}</span>
                    <div className="flex-1 bg-secondary rounded-full h-1.5 overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${(count / total) * 100}%`, background: meta?.color ?? '#D97706' }}
                      />
                    </div>
                    <span className="text-[10px] text-muted-foreground w-8 text-right">{count}</span>
                  </div>
                )
              })}
          </div>
        </div>
      )}

      <button
        onClick={() => { AnalyticsService.clear(); toast('נתוני ניתוח נמחקו') }}
        className="text-xs text-destructive hover:underline"
        aria-label="מחק נתוני ניתוח"
      >
        מחק נתוני ניתוח
      </button>
    </div>
  )
}

function ShortcutsTab() {
  return (
    <div className="space-y-2">
      <p className="text-xs text-muted-foreground mb-3">קיצורי מקלדת זמינים:</p>
      {KEYBOARD_SHORTCUTS.map((s) => (
        <div key={s.action} className="flex items-center justify-between py-1.5 border-b border-border/50 last:border-0">
          <span className="text-xs text-muted-foreground">{s.description}</span>
          <div className="flex items-center gap-1">
            {s.modifier !== 'none' && (
              <kbd className="px-1.5 py-0.5 text-[10px] bg-secondary border border-border rounded font-mono">
                {s.modifier === 'ctrl' ? '⌃' : s.modifier === 'meta' ? '⌘' : s.modifier === 'alt' ? '⌥' : '⇧'}
              </kbd>
            )}
            <kbd className="px-1.5 py-0.5 text-[10px] bg-secondary border border-border rounded font-mono">
              {s.key}
            </kbd>
          </div>
        </div>
      ))}
    </div>
  )
}

function BackupTab() {
  const conversations = useChatStore((s) => s.conversations)
  const backups = BackupService.list()
  const importRef = useRef<HTMLInputElement>(null)

  async function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      BackupService.autoSave(conversations)
      const imported = await ExportService.import(file)
      const store = useChatStore.getState()
      const ids = new Set(store.conversations.map((c) => c.id))
      useChatStore.setState((s) => ({
        conversations: [...s.conversations, ...imported.filter((c) => !ids.has(c.id))],
      }))
      toast.success(`${imported.length} שיחות יובאו`)
    } catch (err) {
      toast.error(`ייבוא נכשל: ${(err as Error).message}`)
    }
    e.target.value = ''
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <button
          onClick={() => { BackupService.save(conversations, 'גיבוי ידני'); toast.success('גיבוי נשמר') }}
          className="flex-1 flex items-center justify-center gap-1.5 text-xs bg-secondary border border-border rounded-lg py-2 hover:bg-muted"
          aria-label="שמור גיבוי"
        >
          <Download size={13} /> שמור גיבוי
        </button>
        <button
          onClick={() => ExportService.export(conversations)}
          className="flex-1 flex items-center justify-center gap-1.5 text-xs bg-secondary border border-border rounded-lg py-2 hover:bg-muted"
          aria-label="ייצא שיחות"
        >
          <Upload size={13} /> ייצוא JSON
        </button>
        <button
          onClick={() => importRef.current?.click()}
          className="flex-1 flex items-center justify-center gap-1.5 text-xs bg-secondary border border-border rounded-lg py-2 hover:bg-muted"
          aria-label="ייבא שיחות"
        >
          <Upload size={13} /> ייבוא
        </button>
        <input ref={importRef} type="file" accept=".json" className="hidden" onChange={handleImport} />
      </div>

      <div>
        <p className="text-xs font-medium mb-2">גיבויים שמורים ({backups.length}/5):</p>
        {backups.length === 0 && <p className="text-xs text-muted-foreground">אין גיבויים עדיין.</p>}
        <div className="space-y-1.5">
          {backups.map((b) => (
            <div key={b.id} className="flex items-center gap-2 bg-secondary rounded-lg px-3 py-2 border border-border">
              <div className="flex-1 min-w-0">
                <div className="text-xs font-medium truncate">{b.label}</div>
                <div className="text-[10px] text-muted-foreground">{b.conversationCount} שיחות</div>
              </div>
              <div className="flex gap-1">
                <button
                  onClick={() => {
                    const restored = BackupService.restore(b.id)
                    if (!restored) return
                    BackupService.autoSave(conversations)
                    useChatStore.setState({ conversations: restored })
                    toast.success('שיחות שוחזרו')
                  }}
                  className="text-[10px] text-primary hover:underline"
                  aria-label="שחזר גיבוי"
                >
                  שחזר
                </button>
                <button
                  onClick={() => { BackupService.delete(b.id); toast('גיבוי נמחק') }}
                  className="p-1 hover:text-destructive text-muted-foreground"
                  aria-label="מחק גיבוי"
                >
                  <Trash2 size={11} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── Main ────────────────────────────────────────────────────
export function SettingsPanel() {
  const { settingsOpen, setSettingsOpen } = useUIStore()
  const [activeTab, setActiveTab] = useState<Tab>('keys')

  const TAB_CONTENT: Record<Tab, React.ReactNode> = {
    keys: <ApiKeysTab />,
    models: <ModelsTab />,
    templates: <TemplatesTab />,
    personas: <PersonasTab />,
    analytics: <AnalyticsTab />,
    shortcuts: <ShortcutsTab />,
    backup: <BackupTab />,
  }

  return (
    <AnimatePresence>
      {settingsOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setSettingsOpen(false)}
            className="fixed inset-0 bg-black/50 z-50"
          />
          <motion.div
            initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
            transition={{ type: 'tween', duration: 0.25 }}
            role="dialog"
            aria-modal="true"
            aria-label="הגדרות"
            className="fixed inset-x-0 bottom-0 z-50 bg-card border-t border-border rounded-t-2xl max-h-[90vh] flex flex-col md:max-w-2xl md:mx-auto md:rounded-2xl md:bottom-8"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-border flex-shrink-0">
              <h2 className="font-bold text-sm">⚙️ הגדרות</h2>
              <button
                onClick={() => setSettingsOpen(false)}
                className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground"
                aria-label="סגור הגדרות"
              >
                <X size={16} />
              </button>
            </div>

            {/* Tab nav */}
            <div className="flex gap-1 px-4 pt-3 overflow-x-auto flex-shrink-0" role="tablist">
              {TABS.map((tab) => {
                const Icon = tab.icon
                const isActive = activeTab === tab.id
                return (
                  <button
                    key={tab.id}
                    role="tab"
                    aria-selected={isActive}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg whitespace-nowrap transition-colors flex-shrink-0 ${
                      isActive ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-secondary'
                    }`}
                  >
                    <Icon size={12} />
                    {tab.label}
                  </button>
                )
              })}
            </div>

            {/* Tab content */}
            <div className="flex-1 overflow-y-auto p-4" role="tabpanel">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.15 }}
                >
                  {TAB_CONTENT[activeTab]}
                </motion.div>
              </AnimatePresence>
            </div>

            <div className="p-4 border-t border-border flex-shrink-0">
              <button
                onClick={() => setSettingsOpen(false)}
                className="w-full bg-primary text-primary-foreground rounded-lg py-2.5 text-sm font-semibold hover:opacity-90 transition-opacity"
                aria-label="שמור וסגור הגדרות"
              >
                ✓ שמור וסגור
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
