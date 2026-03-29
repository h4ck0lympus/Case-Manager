import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createHash } from 'crypto'

function computeOld(previousHash: string, timestamp: string, userId: string, action: string, tableName: string, recordId: string) {
  return createHash('sha256').update(`${previousHash}|${timestamp}|${userId}|${action}|${tableName}|${recordId}`).digest('hex')
}

function computeNew(previousHash: string, userEmail: string, action: string, tableName: string, recordId: string) {
  return createHash('sha256').update(`${previousHash}|${userEmail}|${action}|${tableName}|${recordId}`).digest('hex')
}

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: entries } = await supabase
    .from('audit_log')
    .select('*')
    .order('id', { ascending: true })

  if (!entries) return NextResponse.json([])

  const debug = entries.map((e: any) => {
    const normalizedTs = new Date(e.timestamp).toISOString()
    const hashWithOldFormula = computeOld(e.previous_hash, normalizedTs, e.user_id ?? '', e.action, e.table_name, e.record_id)
    const hashWithNewFormula = computeNew(e.previous_hash, e.user_email, e.action, e.table_name, e.record_id)
    return {
      id: e.id,
      stored_hash: e.entry_hash,
      old_formula_matches: hashWithOldFormula === e.entry_hash,
      new_formula_matches: hashWithNewFormula === e.entry_hash,
      raw_timestamp_from_db: e.timestamp,
      normalized_timestamp: normalizedTs,
      user_id: e.user_id,
      user_email: e.user_email,
    }
  })

  return NextResponse.json(debug)
}
