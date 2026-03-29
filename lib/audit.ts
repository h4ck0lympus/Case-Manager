import { createHash } from 'crypto'
import { createClient } from './supabase/server'

export function computeHash(
  previousHash: string,
  timestamp: string,
  userId: string,
  action: string,
  tableName: string,
  recordId: string
): string {
  const payload = `${previousHash}|${timestamp}|${userId}|${action}|${tableName}|${recordId}`
  return createHash('sha256').update(payload).digest('hex')
}

interface AuditEntry {
  userId: string
  userEmail: string
  action: 'CREATE' | 'UPDATE' | 'DELETE'
  tableName: string
  recordId: string
  changeSummary?: string
}

export async function appendAuditEntry(entry: AuditEntry) {
  const supabase = await createClient()

  const { data: last } = await supabase
    .from('audit_log')
    .select('entry_hash')
    .order('id', { ascending: false })
    .limit(1)
    .maybeSingle()

  const previousHash = last?.entry_hash ?? '0'.repeat(64)
  const timestamp = new Date().toISOString()
  const entryHash = computeHash(
    previousHash,
    timestamp,
    entry.userId,
    entry.action,
    entry.tableName,
    entry.recordId
  )

  const { error } = await supabase.from('audit_log').insert({
    user_id: entry.userId,
    user_email: entry.userEmail,
    action: entry.action,
    table_name: entry.tableName,
    record_id: entry.recordId,
    change_summary: entry.changeSummary ?? null,
    previous_hash: previousHash,
    entry_hash: entryHash,
    timestamp,
  })

  if (error) {
    console.error('Audit log insert failed:', error)
  }
}

export async function verifyChain(): Promise<{ valid: boolean; brokenAt?: number; totalEntries: number }> {
  const supabase = await createClient()
  const { data: entries } = await supabase
    .from('audit_log')
    .select('*')
    .order('id', { ascending: true })

  if (!entries || entries.length === 0) return { valid: true, totalEntries: 0 }

  for (let i = 1; i < entries.length; i++) {
    const normalizedTimestamp = new Date(entries[i].timestamp).toISOString()
    const expected = computeHash(
      entries[i].previous_hash,
      normalizedTimestamp,
      entries[i].user_id ?? '',
      entries[i].action,
      entries[i].table_name,
      entries[i].record_id
    )
    if (expected !== entries[i].entry_hash) {
      return { valid: false, brokenAt: entries[i].id, totalEntries: entries.length }
    }
  }

  return { valid: true, totalEntries: entries.length }
}
