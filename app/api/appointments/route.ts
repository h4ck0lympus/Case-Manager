import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAppointmentSchema } from '@/lib/validation'
import { appendAuditEntry } from '@/lib/audit'

export async function GET(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const clientId = searchParams.get('client_id')

  let query = supabase
    .from('appointments')
    .select('*, clients(first_name, last_name)')
    .order('starts_at', { ascending: true })

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
  const parsed = createAppointmentSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 })
  }

  const sanitized = Object.fromEntries(
    Object.entries(parsed.data).map(([key, value]) => [key, value === '' ? null : value]),
  )

  const { data, error } = await supabase
    .from('appointments')
    .insert({ ...sanitized, created_by: user.id })
    .select('id, client_id, title')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  await appendAuditEntry({
    userId: user.id,
    userEmail: user.email!,
    action: 'CREATE',
    tableName: 'appointments',
    recordId: data.id,
    changeSummary: `Scheduled appointment "${data.title}" for client ${data.client_id}`,
  })

  return NextResponse.json({ id: data.id }, { status: 201 })
}
