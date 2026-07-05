import { type ReactNode } from 'react'
import { useTheme } from '../hooks/useTheme'

interface Props { children: ReactNode }

/**
 * Applies the persisted theme (dark/light/system) to the document root.
 * Must be mounted once near the app root.
 */
export function ThemeProvider({ children }: Props) {
  useTheme()
  return <>{children}</>
}
