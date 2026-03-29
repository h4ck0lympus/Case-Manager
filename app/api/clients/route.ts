import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClientSchema } from '@/lib/validation'
import { appendAuditEntry } from '@/lib/audit'

export async function GET(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const q = searchParams.get('q')

  let query = supabase.from('clients').select('*').eq('is_active', true).order('last_name')
  if (q) query = query.or(`first_name.ilike.%${q}%,last_name.ilike.%${q}%`)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const parsed = createClientSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 })
  }

  const sanitized = Object.fromEntries(
    Object.entries(parsed.data).map(([k, v]) => [k, v === '' ? null : v])
  )

  const { data, error } = await supabase
    .from('clients')
    .insert({ ...sanitized, created_by: user.id })
    .select('id')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  await appendAuditEntry({
    userId: user.id,
    userEmail: user.email!,
    action: 'CREATE',
    tableName: 'clients',
    recordId: data.id,
    changeSummary: `Created client: ${parsed.data.first_name} ${parsed.data.last_name}`,
  })

  return NextResponse.json({ id: data.id }, { status: 201 })
}
