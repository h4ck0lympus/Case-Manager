import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import Anthropic from '@anthropic-ai/sdk'
import { summarizeClientSchema } from '@/lib/validation'

const anthropic = new Anthropic()

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const parsed = summarizeClientSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid client ID' }, { status: 400 })
  }

  const { clientId } = parsed.data

  const { data: client } = await supabase
    .from('clients').select('*').eq('id', clientId).single()
  if (!client) return NextResponse.json({ error: 'Client not found' }, { status: 404 })

  const { data: entries } = await supabase
    .from('service_entries')
    .select('service_date, service_type, notes, ai_summary, ai_risk_flags, ai_action_items')
    .eq('client_id', clientId)
    .order('service_date', { ascending: true })

  if (!entries || entries.length === 0) {
    return NextResponse.json({ error: 'No service history to summarize' }, { status: 400 })
  }

  const historyText = entries.map((e: any) => {
    const noteText = e.ai_summary || e.notes || '(no notes)'
    const risks = e.ai_risk_flags?.length ? `  ⚠ Risks: ${e.ai_risk_flags.join(', ')}` : ''
    return `[${e.service_date}] ${e.service_type}: ${noteText}${risks}`
  }).join('\n')

  try {
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 2048,
      messages: [{
        role: 'user',
        content: `Generate a clinical handoff summary for a nonprofit case manager who is taking over this client's case.

Client: ${client.first_name} ${client.last_name}
DOB: ${client.date_of_birth ?? 'Unknown'}
Language: ${client.language ?? 'English'}
Household size: ${client.household_size ?? 'Unknown'}

Service History (${entries.length} entries):
${historyText}

Write a structured handoff summary using these exact markdown section headers:

## Background
## Services History
## Current Status
## Active Needs
## Risk Factors
## Recommended Next Steps

Formatting rules:
- Use simple markdown only: headings, short paragraphs, and bullet lists
- Do not use markdown tables
- Do not include code fences
- Do not restate the section headers in another style

Be concise, professional, and actionable. Focus on what the incoming case manager needs to know immediately.`,
      }],
    })

    const content = message.content[0]
    if (content.type !== 'text') throw new Error('Unexpected response')

    return NextResponse.json({ summary: content.text })
  } catch (e: any) {
    console.error('Summarize error:', e)
    return NextResponse.json({ error: 'Failed to generate summary' }, { status: 500 })
  }
}
