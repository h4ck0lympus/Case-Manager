import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'
import { verifyChain } from '@/lib/audit'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Users, ClipboardList, AlertTriangle, ShieldCheck, ShieldAlert, TrendingUp } from 'lucide-react'
import Link from 'next/link'
import { formatDate } from '@/lib/utils'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user!.id).single()

  const { count: totalClients } = await supabase
    .from('clients').select('*', { count: 'exact', head: true }).eq('is_active', true)

  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
  const { count: servicesThisMonth } = await supabase
    .from('service_entries').select('*', { count: 'exact', head: true })
    .gte('service_date', thirtyDaysAgo.toISOString().split('T')[0])

  const { count: pendingFollowUps } = await supabase
    .from('follow_ups').select('*', { count: 'exact', head: true }).eq('completed', false)

  const { data: recentServices } = await supabase
    .from('service_entries')
    .select('*, clients(first_name, last_name)')
    .order('created_at', { ascending: false })
    .limit(5)

  const { data: riskyEntries } = await supabase
    .from('service_entries')
    .select('*, clients(first_name, last_name)')
    .neq('ai_risk_flags', '[]')
    .order('service_date', { ascending: false })
    .limit(3)

  let chainStatus = null
  if (profile?.role === 'admin') {
    chainStatus = await verifyChain()
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Overview of your case management activity</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Active Clients</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalClients ?? 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Services (30 days)</CardTitle>
            <ClipboardList className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{servicesThisMonth ?? 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Pending Follow-ups</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingFollowUps ?? 0}</div>
          </CardContent>
        </Card>

        {profile?.role === 'admin' && chainStatus && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Audit Chain</CardTitle>
              {chainStatus.valid
                ? <ShieldCheck className="h-4 w-4 text-green-600" aria-hidden="true" />
                : <ShieldAlert className="h-4 w-4 text-red-600" aria-hidden="true" />}
            </CardHeader>
            <CardContent>
              <Badge variant={chainStatus.valid ? 'success' : 'danger'}>
                {chainStatus.valid ? '✓ Intact' : '⚠ Broken'}
              </Badge>
              <p className="text-xs text-muted-foreground mt-1">
                {chainStatus.totalEntries} entries
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent services */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recent Services</CardTitle>
          </CardHeader>
          <CardContent>
            {recentServices && recentServices.length > 0 ? (
              <ul className="space-y-3" role="list">
                {recentServices.map((s: any) => (
                  <li key={s.id} className="flex items-start justify-between gap-2">
                    <div>
                      <Link
                        href={`/dashboard/clients/${s.client_id}`}
                        className="text-sm font-medium hover:underline focus:underline focus:outline-none"
                      >
                        {s.clients?.first_name} {s.clients?.last_name}
                      </Link>
                      <p className="text-xs text-muted-foreground">{s.service_type}</p>
                    </div>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">{formatDate(s.service_date)}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">No services logged yet.</p>
            )}
          </CardContent>
        </Card>

        {/* Risk alerts */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-500" aria-hidden="true" />
              AI Risk Flags
            </CardTitle>
          </CardHeader>
          <CardContent>
            {riskyEntries && riskyEntries.length > 0 ? (
              <ul className="space-y-3" role="list">
                {riskyEntries.map((s: any) => (
                  <li key={s.id} className="space-y-1">
                    <Link
                      href={`/dashboard/clients/${s.client_id}`}
                      className="text-sm font-medium hover:underline focus:underline focus:outline-none"
                    >
                      {s.clients?.first_name} {s.clients?.last_name}
                    </Link>
                    <div className="flex flex-wrap gap-1">
                      {(s.ai_risk_flags as string[]).map((flag, i) => (
                        <Badge key={i} variant="danger" className="text-xs">{flag}</Badge>
                      ))}
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">No active risk flags.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
