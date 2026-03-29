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

function addDays(from: Date, days: number) {
  const date = new Date(from)
  date.setDate(date.getDate() + days)
  return date
}

function isSameDay(left: Date, right: Date) {
  return (
    left.getFullYear() === right.getFullYear()
    && left.getMonth() === right.getMonth()
    && left.getDate() === right.getDate()
  )
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

  const overdueFollowUps = (dueFollowUps ?? []).filter((followUp: any) => {
    const dueDate = new Date(`${followUp.due_date}T00:00:00`)
    return dueDate < today
  })

  const weekDays = Array.from({ length: 7 }, (_, index) => addDays(today, index))

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
              <CardTitle className="text-base">This Week</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                {weekDays.map((day) => {
                  const dayAppointments = (appointments ?? []).filter((appointment: any) =>
                    isSameDay(new Date(appointment.starts_at), day),
                  )
                  const dayFollowUps = (dueFollowUps ?? []).filter((followUp: any) =>
                    isSameDay(new Date(`${followUp.due_date}T00:00:00`), day),
                  )

                  return (
                    <div key={day.toISOString()} className="rounded-md border p-3 space-y-3">
                      <div>
                        <p className="text-sm font-medium">{day.toLocaleDateString('en-US', { weekday: 'long' })}</p>
                        <p className="text-xs text-muted-foreground">{formatDate(day.toISOString())}</p>
                      </div>

                      {dayAppointments.length === 0 && dayFollowUps.length === 0 ? (
                        <p className="text-sm text-muted-foreground">No items</p>
                      ) : (
                        <div className="space-y-2">
                          {dayAppointments.map((appointment: any) => (
                            <div key={appointment.id} className="rounded-md bg-blue-50 border border-blue-100 p-2">
                              <p className="text-sm font-medium text-blue-900">{appointment.title}</p>
                              <p className="text-xs text-blue-800">
                                {appointment.clients?.first_name} {appointment.clients?.last_name}
                              </p>
                              <p className="text-xs text-blue-700">{formatDateTime(appointment.starts_at)}</p>
                            </div>
                          ))}

                          {dayFollowUps.map((followUp: any) => (
                            <div key={followUp.id} className="rounded-md bg-amber-50 border border-amber-100 p-2">
                              <p className="text-sm font-medium text-amber-900">{followUp.description}</p>
                              <p className="text-xs text-amber-800">
                                <Link href={`/dashboard/clients/${followUp.client_id}`} className="hover:underline">
                                  {followUp.clients?.first_name} {followUp.clients?.last_name}
                                </Link>
                              </p>
                              <p className="text-xs text-amber-700">Follow-up due</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Overdue Follow-ups</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {overdueFollowUps.length > 0 ? (
                overdueFollowUps.map((followUp: any) => (
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
                <p className="text-sm text-muted-foreground">No overdue follow-ups.</p>
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
