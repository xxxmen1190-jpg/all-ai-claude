import { memo } from 'react'
import { motion } from 'framer-motion'

interface Props {
  text: string
  color?: string
}

/**
 * Renders a streaming token cursor at the end of in-progress text.
 * Memoized — only re-renders when text or color changes.
 */
export const StreamingText = memo(function StreamingText({ text, color = '#D97706' }: Props) {
  return (
    <span>
      {text}
      <motion.span
        animate={{ opacity: [1, 0] }}
        transition={{ duration: 0.6, repeat: Infinity, repeatType: 'reverse' }}
        className="inline-block w-0.5 h-3.5 ml-0.5 rounded-sm align-text-bottom"
        style={{ background: color }}
      />
    </span>
  )
})
