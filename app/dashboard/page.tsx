import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'
import { verifyChain } from '@/lib/audit'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Users, ClipboardList, AlertTriangle, ShieldCheck, ShieldAlert, TrendingUp } from 'lucide-react'
import Link from 'next/link'
import { formatDate } from '@/lib/utils'

function getQuarterStart(date: Date) {
  const month = Math.floor(date.getMonth() / 3) * 3
  return new Date(Date.UTC(date.getFullYear(), month, 1))
}

function countBy(items: string[]) {
  const counts = new Map<string, number>()
  for (const item of items) counts.set(item, (counts.get(item) ?? 0) + 1)
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([label, count]) => ({ label, count }))
}

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

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const nextWeek = new Date(today)
  nextWeek.setDate(nextWeek.getDate() + 7)

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

  const { data: upcomingAppointments } = await supabase
    .from('appointments')
    .select('id, client_id, title, starts_at, clients(first_name, last_name)')
    .gte('starts_at', today.toISOString())
    .lte('starts_at', nextWeek.toISOString())
    .order('starts_at', { ascending: true })
    .limit(5)

  const { data: dueFollowUps } = await supabase
    .from('follow_ups')
    .select('id, client_id, description, due_date, urgency, clients(first_name, last_name)')
    .eq('completed', false)
    .lte('due_date', nextWeek.toISOString().slice(0, 10))
    .order('due_date', { ascending: true })
    .limit(5)

  const quarterStart = getQuarterStart(new Date())
  const quarterStartDate = quarterStart.toISOString().slice(0, 10)

  const { data: quarterServices } = await supabase
    .from('service_entries')
    .select('service_date, service_type, ai_risk_flags')
    .gte('service_date', quarterStartDate)
    .order('service_date', { ascending: true })

  const recentQuarterServiceTypes = countBy(
    (quarterServices ?? []).map((service: any) => service.service_type || 'Other'),
  ).slice(0, 5)

  const recentQuarterRiskFlags = countBy(
    (quarterServices ?? []).flatMap((service: any) => Array.isArray(service.ai_risk_flags) ? service.ai_risk_flags : []),
  ).slice(0, 5)

  const recentQuarterMonths = countBy(
    (quarterServices ?? []).map((service: any) =>
      new Date(`${service.service_date}T00:00:00Z`).toLocaleString('en-US', { month: 'short', timeZone: 'UTC' }),
    ),
  )

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

      {profile?.role === 'admin' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Recent Quarter Service Mix</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {recentQuarterServiceTypes.length > 0 ? (
                recentQuarterServiceTypes.map((item) => {
                  const max = recentQuarterServiceTypes[0]?.count ?? 1
                  return (
                    <div key={item.label} className="space-y-1">
                      <div className="flex items-center justify-between gap-3 text-sm">
                        <span className="truncate">{item.label}</span>
                        <span className="text-muted-foreground">{item.count}</span>
                      </div>
                      <div className="h-2 rounded-full bg-muted">
                        <div
                          className="h-2 rounded-full bg-primary"
                          style={{ width: `${(item.count / max) * 100}%` }}
                        />
                      </div>
                    </div>
                  )
                })
              ) : (
                <p className="text-sm text-muted-foreground">No quarter service data yet.</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Recent Quarter Trends</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <p className="text-sm font-medium">Monthly Volume</p>
                {recentQuarterMonths.length > 0 ? (
                  recentQuarterMonths.map((item) => {
                    const max = Math.max(...recentQuarterMonths.map((entry) => entry.count), 1)
                    return (
                      <div key={item.label} className="space-y-1">
                        <div className="flex items-center justify-between gap-3 text-sm">
                          <span>{item.label}</span>
                          <span className="text-muted-foreground">{item.count}</span>
                        </div>
                        <div className="h-2 rounded-full bg-muted">
                          <div
                            className="h-2 rounded-full bg-blue-500"
                            style={{ width: `${(item.count / max) * 100}%` }}
                          />
                        </div>
                      </div>
                    )
                  })
                ) : (
                  <p className="text-sm text-muted-foreground">No monthly activity yet.</p>
                )}
              </div>

              <div className="space-y-3">
                <p className="text-sm font-medium">Top Risk Flags</p>
                {recentQuarterRiskFlags.length > 0 ? (
                  recentQuarterRiskFlags.map((item) => {
                    const max = recentQuarterRiskFlags[0]?.count ?? 1
                    return (
                      <div key={item.label} className="space-y-1">
                        <div className="flex items-center justify-between gap-3 text-sm">
                          <span className="truncate">{item.label}</span>
                          <span className="text-muted-foreground">{item.count}</span>
                        </div>
                        <div className="h-2 rounded-full bg-muted">
                          <div
                            className="h-2 rounded-full bg-amber-500"
                            style={{ width: `${(item.count / max) * 100}%` }}
                          />
                        </div>
                      </div>
                    )
                  })
                ) : (
                  <p className="text-sm text-muted-foreground">No AI risk flags this quarter.</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Notifications</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {((dueFollowUps?.length ?? 0) > 0 || (upcomingAppointments?.length ?? 0) > 0) ? (
              <>
                {(dueFollowUps ?? []).map((item: any) => (
                  <div key={`followup-${item.id}`} className="rounded-md border p-3">
                    <p className="text-sm font-medium">{item.description}</p>
                    <p className="text-xs text-muted-foreground">
                      Follow-up for {item.clients?.first_name} {item.clients?.last_name} due {formatDate(item.due_date)}
                    </p>
                  </div>
                ))}
                {(upcomingAppointments ?? []).map((item: any) => (
                  <div key={`appointment-${item.id}`} className="rounded-md border p-3">
                    <p className="text-sm font-medium">{item.title}</p>
                    <p className="text-xs text-muted-foreground">
                      Appointment for {item.clients?.first_name} {item.clients?.last_name} at {formatDate(item.starts_at)}
                    </p>
                  </div>
                ))}
              </>
            ) : (
              <p className="text-sm text-muted-foreground">No upcoming reminders right now.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Schedule</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              View appointments, pending follow-ups, and weekly scheduling in the calendar.
            </p>
            <Link
              href="/dashboard/calendar"
              className="inline-flex rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
            >
              Open Calendar
            </Link>
          </CardContent>
        </Card>
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
