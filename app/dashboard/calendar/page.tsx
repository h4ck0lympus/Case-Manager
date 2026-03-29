import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import AppointmentForm from '@/components/AppointmentForm'
import Link from 'next/link'
import { formatDate, formatDateTime } from '@/lib/utils'

function startOfToday() {
  const date = new Date()
  date.setHours(0, 0, 0, 0)
  return date
}

function endOfWeek(from: Date) {
  const date = new Date(from)
  date.setDate(date.getDate() + 7)
  return date
}

export default async function CalendarPage({ searchParams }: { searchParams: Promise<{ client_id?: string }> }) {
  const supabase = await createClient()
  const { client_id } = await searchParams
  const today = startOfToday()
  const weekEnd = endOfWeek(today)

  const { data: clients } = await supabase
    .from('clients')
    .select('id, first_name, last_name')
    .eq('is_active', true)
    .order('last_name')

  const { data: appointments } = await supabase
    .from('appointments')
    .select('*, clients(first_name, last_name)')
    .gte('starts_at', today.toISOString())
    .lte('starts_at', weekEnd.toISOString())
    .order('starts_at', { ascending: true })

  const { data: dueFollowUps } = await supabase
    .from('follow_ups')
    .select('*, clients(first_name, last_name)')
    .eq('completed', false)
    .lte('due_date', weekEnd.toISOString().slice(0, 10))
    .order('due_date', { ascending: true })

  const todaysAppointments = (appointments ?? []).filter((appointment: any) => {
    const startsAt = new Date(appointment.starts_at)
    return startsAt >= today && startsAt < new Date(today.getTime() + 24 * 60 * 60 * 1000)
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Calendar & Reminders</h1>
        <p className="text-muted-foreground">Track follow-ups, upcoming appointments, and today&apos;s schedule.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Today</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {todaysAppointments.length > 0 ? (
                todaysAppointments.map((appointment: any) => (
                  <div key={appointment.id} className="rounded-md border p-3">
                    <p className="font-medium">{appointment.title}</p>
                    <p className="text-sm text-muted-foreground">
                      {appointment.clients?.first_name} {appointment.clients?.last_name}
                    </p>
                    <p className="text-sm text-muted-foreground">{formatDateTime(appointment.starts_at)}</p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No appointments scheduled for today.</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">This Week</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {appointments && appointments.length > 0 ? (
                appointments.map((appointment: any) => (
                  <div key={appointment.id} className="rounded-md border p-3">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="font-medium">{appointment.title}</p>
                        <p className="text-sm text-muted-foreground">
                          <Link href={`/dashboard/clients/${appointment.client_id}`} className="hover:underline">
                            {appointment.clients?.first_name} {appointment.clients?.last_name}
                          </Link>
                        </p>
                      </div>
                      <p className="text-sm text-muted-foreground whitespace-nowrap">
                        {formatDateTime(appointment.starts_at)}
                      </p>
                    </div>
                    {appointment.notes && (
                      <p className="mt-2 text-sm text-muted-foreground">{appointment.notes}</p>
                    )}
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No appointments this week.</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Pending Follow-ups</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {dueFollowUps && dueFollowUps.length > 0 ? (
                dueFollowUps.map((followUp: any) => (
                  <div key={followUp.id} className="rounded-md border p-3">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="font-medium">{followUp.description}</p>
                        <p className="text-sm text-muted-foreground">
                          <Link href={`/dashboard/clients/${followUp.client_id}`} className="hover:underline">
                            {followUp.clients?.first_name} {followUp.clients?.last_name}
                          </Link>
                        </p>
                      </div>
                      <p className="text-sm text-muted-foreground whitespace-nowrap">
                        Due {formatDate(followUp.due_date)}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No pending follow-ups this week.</p>
              )}
            </CardContent>
          </Card>
        </div>

        <div>
          <AppointmentForm clients={clients ?? []} defaultClientId={client_id} />
        </div>
      </div>
    </div>
  )
}
