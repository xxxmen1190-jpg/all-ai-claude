import type { Conversation } from '../../types'
import { ExportService } from './ExportService'
import { Logger } from '../logging/Logger'

const BACKUP_KEY = 'aio_backup_v1'
const MAX_BACKUPS = 5

export interface BackupEntry {
  id: string
  createdAt: number
  label: string
  conversationCount: number
  conversations: Conversation[]
}

/**
 * Automatic local backup system — saves up to MAX_BACKUPS snapshots
 * in localStorage, and allows manual restore from any snapshot
 * or from a downloaded JSON file.
 */
export const BackupService = {
  save(conversations: Conversation[], label?: string): BackupEntry {
    const backups = BackupService.list()
    const entry: BackupEntry = {
      id: `bk-${Date.now()}`,
      createdAt: Date.now(),
      label: label ?? `גיבוי אוטומטי ${new Date().toLocaleString('he-IL')}`,
      conversationCount: conversations.length,
      conversations,
    }
    backups.unshift(entry)
    const trimmed = backups.slice(0, MAX_BACKUPS)
    try {
      localStorage.setItem(BACKUP_KEY, JSON.stringify(trimmed))
    } catch {
      // If quota exceeded, keep only 2 most recent
      localStorage.setItem(BACKUP_KEY, JSON.stringify(trimmed.slice(0, 2)))
    }
    Logger.info('BackupService', `saved backup: ${entry.label}`, { count: conversations.length })
    return entry
  },

  list(): BackupEntry[] {
    try {
      const raw = localStorage.getItem(BACKUP_KEY)
      return raw ? JSON.parse(raw) : []
    } catch {
      return []
    }
  },

  restore(backupId: string): Conversation[] | null {
    const backup = BackupService.list().find((b) => b.id === backupId)
    if (!backup) return null
    Logger.info('BackupService', `restored backup: ${backup.label}`)
    return backup.conversations
  },

  delete(backupId: string): void {
    const filtered = BackupService.list().filter((b) => b.id !== backupId)
    localStorage.setItem(BACKUP_KEY, JSON.stringify(filtered))
  },

  /** Export a specific backup snapshot as a downloadable JSON file */
  exportBackup(backupId: string): void {
    const backup = BackupService.list().find((b) => b.id === backupId)
    if (!backup) return
    ExportService.export(backup.conversations)
  },

  /** Auto-backup — call before destructive operations (e.g. import/clear) */
  autoSave(conversations: Conversation[]): void {
    if (conversations.length === 0) return
    BackupService.save(conversations, `גיבוי אוטומטי לפני שינוי`)
  },
}
