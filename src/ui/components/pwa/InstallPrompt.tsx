import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Download } from 'lucide-react'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

/**
 * Shows a native-style install banner when the browser fires
 * the beforeinstallprompt event (Chrome/Edge/Android).
 * On iOS, shows manual install instructions since iOS doesn't
 * support the event.
 */
export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [show, setShow] = useState(false)
  const [isIOS, setIsIOS] = useState(false)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    // Don't show if already installed (standalone mode)
    if (window.matchMedia('(display-mode: standalone)').matches) return
    if (localStorage.getItem('pwa_install_dismissed')) return

    // Detect iOS Safari
    const ua = navigator.userAgent
    const ios = /iPad|iPhone|iPod/.test(ua) && !('MSStream' in window)
    if (ios) {
      setIsIOS(true)
      // Show after a short delay so it doesn't feel intrusive
      setTimeout(() => setShow(true), 4000)
    }

    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      setTimeout(() => setShow(true), 2000)
    }

    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  function dismiss() {
    setShow(false)
    setDismissed(true)
    localStorage.setItem('pwa_install_dismissed', '1')
  }

  async function install() {
    if (!deferredPrompt) return
    await deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    if (outcome === 'accepted') setShow(false)
    setDeferredPrompt(null)
  }

  if (dismissed) return null

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          role="dialog"
          aria-label="התקנת האפליקציה"
          className="fixed bottom-20 left-4 right-4 z-50 max-w-sm mx-auto bg-card border border-border rounded-2xl shadow-2xl p-4"
        >
          <button
            onClick={dismiss}
            className="absolute top-3 left-3 p-1 hover:bg-secondary rounded-full text-muted-foreground"
            aria-label="סגור"
          >
            <X size={14} />
          </button>

          <div className="flex items-start gap-3">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0 text-2xl">
              🤖
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-bold">התקן את AI Orchestrator</h3>
              {isIOS ? (
                <p className="text-xs text-muted-foreground mt-1">
                  לחץ על{' '}
                  <span className="font-semibold">שתף</span>
                  {' '}↑ ואז{' '}
                  <span className="font-semibold">"הוסף למסך הבית"</span>
                </p>
              ) : (
                <p className="text-xs text-muted-foreground mt-1">
                  גישה מהירה מהמסך הראשי, עובד במצב לא מקוון
                </p>
              )}
              {!isIOS && (
                <button
                  onClick={install}
                  className="mt-2.5 flex items-center gap-1.5 text-xs bg-primary text-primary-foreground rounded-lg px-3 py-1.5 hover:opacity-90 transition-opacity"
                  aria-label="התקן אפליקציה"
                >
                  <Download size={12} /> התקן עכשיו
                </button>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
