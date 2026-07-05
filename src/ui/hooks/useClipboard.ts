import { useState, useCallback } from 'react'
import toast from 'react-hot-toast'

export function useClipboard() {
  const [copied, setCopied] = useState(false)

  const copy = useCallback(async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      toast.success('הועתק!')
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error('לא ניתן להעתיק')
    }
  }, [])

  return { copy, copied }
}
