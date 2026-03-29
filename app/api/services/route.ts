import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceSchema } from '@/lib/validation'
import { appendAuditEntry } from '@/lib/audit'

export async function GET(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const clientId = searchParams.get('client_id')

  let query = supabase.from('service_entries').select('*').order('service_date', { ascending: false })
  if (clientId) query = query.eq('client_id', clientId)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const parsed = createServiceSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('service_entries')
    .insert({ ...parsed.data, staff_id: user.id })
    .select('id')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  await appendAuditEntry({
    userId: user.id,
    userEmail: user.email!,
    action: 'CREATE',
    tableName: 'service_entries',
    recordId: data.id,
    changeSummary: `Logged ${parsed.data.service_type} for client ${parsed.data.client_id}`,
  })

  if (parsed.data.ai_suggested_followup) {
    const description = parsed.data.ai_action_items[0]
      ?? `${parsed.data.service_type} follow-up`

    const { error: followUpError } = await supabase
      .from('follow_ups')
      .insert({
        client_id: parsed.data.client_id,
        service_entry_id: data.id,
        due_date: parsed.data.ai_suggested_followup,
        description,
        category: parsed.data.service_type,
        urgency: parsed.data.ai_risk_flags.length > 0 ? 'high' : 'normal',
      })

    if (followUpError) {
      console.error('Follow-up insert failed:', followUpError)
    }

    const appointmentStart = new Date(`${parsed.data.ai_suggested_followup}T09:00:00`)
    const appointmentEnd = new Date(`${parsed.data.ai_suggested_followup}T09:30:00`)

    const { error: appointmentError } = await supabase
      .from('appointments')
      .insert({
        client_id: parsed.data.client_id,
        title: description,
        starts_at: appointmentStart.toISOString(),
        ends_at: appointmentEnd.toISOString(),
        notes: `Auto-created from ${parsed.data.service_type} service entry`,
        created_by: user.id,
      })

    if (appointmentError) {
      console.error('Appointment auto-create failed:', appointmentError)
    }
  }

  return NextResponse.json({ id: data.id }, { status: 201 })
}
