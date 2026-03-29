import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import Anthropic from '@anthropic-ai/sdk'
import { structureNoteSchema } from '@/lib/validation'

const anthropic = new Anthropic()

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const parsed = structureNoteSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input' }, { status: 400 })
  }

  const { transcript, serviceTypes } = parsed.data

  try {
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      messages: [{
        role: 'user',
        content: `You are a case management assistant for a nonprofit organization. Structure this spoken case note into a JSON object.

Available service types: ${serviceTypes.join(', ')}

Transcript: "${transcript}"

Return ONLY valid JSON, no markdown code blocks, no explanation:
{
  "summary": "2-3 sentence professional structured summary of the interaction",
  "service_type": "the most appropriate service type from the available list",
  "action_items": ["specific actionable follow-up item 1", "item 2"],
  "risk_flags": ["risk flag if any serious concern mentioned"] or [],
  "suggested_followup_days": <integer number of days from today if a timeframe was mentioned, otherwise null>,
  "mood_assessment": "stable" or "concerning" or "crisis" or "unknown"
}`,
      }],
    })

    const content = message.content[0]
    if (content.type !== 'text') throw new Error('Unexpected response type')

    const structured = JSON.parse(content.text)

    if (typeof structured.suggested_followup_days === 'number') {
      const date = new Date()
      date.setDate(date.getDate() + structured.suggested_followup_days)
      structured.suggested_followup_date = date.toISOString().split('T')[0]
    } else {
      structured.suggested_followup_date = null
    }
    delete structured.suggested_followup_days

    return NextResponse.json(structured)
  } catch (e: any) {
    console.error('Structure note error:', e)
    return NextResponse.json({ error: 'Failed to structure note' }, { status: 500 })
  }
}
