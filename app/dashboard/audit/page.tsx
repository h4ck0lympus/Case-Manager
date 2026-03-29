import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'
import { verifyChain } from '@/lib/audit'
import { redirect } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ShieldCheck, ShieldAlert, Lock } from 'lucide-react'
import { formatDateTime } from '@/lib/utils'

export default async function AuditLogPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user!.id).single()
  if (profile?.role !== 'admin') redirect('/dashboard')

  const { valid, brokenAt, totalEntries } = await verifyChain()

  const { data: entries } = await supabase
    .from('audit_log')
    .select('*')
    .order('id', { ascending: false })
    .limit(100)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Lock className="h-6 w-6" aria-hidden="true" />
          Audit Log
        </h1>
        <p className="text-muted-foreground">Tamper-evident record of all system actions</p>
      </div>

      {/* Chain integrity status */}
      <Card className={valid ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
        <CardContent className="p-4 flex items-center gap-4">
          {valid
            ? <ShieldCheck className="h-8 w-8 text-green-600 flex-shrink-0" aria-hidden="true" />
            : <ShieldAlert className="h-8 w-8 text-red-600 flex-shrink-0" aria-hidden="true" />}
          <div>
            <p className={`font-semibold ${valid ? 'text-green-800' : 'text-red-800'}`}>
              {valid ? 'Chain Integrity: INTACT' : `Chain BROKEN at entry #${brokenAt}`}
            </p>
            <p className={`text-sm ${valid ? 'text-green-700' : 'text-red-700'}`}>
              {valid
                ? `All ${totalEntries} entries are cryptographically verified. SHA-256 hash chain is unbroken — no records have been modified or deleted.`
                : `A tampered or deleted record was detected. This indicates unauthorized data modification.`}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Security explanation for judges */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">How it works</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-1">
          <p>Each audit entry contains: <code className="bg-muted px-1 rounded text-xs">SHA256(previous_hash | timestamp | user | action | table | record_id)</code></p>
          <p>If any entry is modified or deleted, the hash chain breaks — making tampering cryptographically detectable.</p>
          <p>The <code className="bg-muted px-1 rounded text-xs">audit_log</code> table has no UPDATE or DELETE RLS policies — append-only at the database layer.</p>
        </CardContent>
      </Card>

      {/* Entries table */}
      <div className="rounded-lg border overflow-x-auto">
        <table className="w-full text-sm" role="grid" aria-label="Audit log entries">
          <thead className="bg-muted/50">
            <tr>
              <th scope="col" className="px-4 py-3 text-left font-medium">#</th>
              <th scope="col" className="px-4 py-3 text-left font-medium">Timestamp</th>
              <th scope="col" className="px-4 py-3 text-left font-medium">User</th>
              <th scope="col" className="px-4 py-3 text-left font-medium">Action</th>
              <th scope="col" className="px-4 py-3 text-left font-medium">Table</th>
              <th scope="col" className="px-4 py-3 text-left font-medium">Summary</th>
              <th scope="col" className="px-4 py-3 text-left font-medium">Hash (first 16)</th>
            </tr>
          </thead>
          <tbody className="divide-y font-mono">
            {entries?.map((e: any) => (
              <tr key={e.id} className="hover:bg-muted/20">
                <td className="px-4 py-2 text-muted-foreground">{e.id}</td>
                <td className="px-4 py-2 text-xs">{formatDateTime(e.timestamp)}</td>
                <td className="px-4 py-2 text-xs truncate max-w-[140px]">{e.user_email}</td>
                <td className="px-4 py-2">
                  <Badge
                    variant={e.action === 'DELETE' ? 'danger' : e.action === 'CREATE' ? 'success' : 'secondary'}
                    className="text-xs"
                  >
                    {e.action}
                  </Badge>
                </td>
                <td className="px-4 py-2 text-xs text-muted-foreground">{e.table_name}</td>
                <td className="px-4 py-2 text-xs text-muted-foreground max-w-[200px] truncate">
                  {e.change_summary ?? '—'}
                </td>
                <td className="px-4 py-2 text-xs text-muted-foreground">
                  <code>{e.entry_hash.slice(0, 16)}…</code>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!entries?.length && (
          <p className="text-center text-muted-foreground py-8 text-sm">No audit entries yet.</p>
        )}
      </div>
    </div>
  )
}
