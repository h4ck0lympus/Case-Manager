import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import Anthropic from '@anthropic-ai/sdk'
import { intakeImageExtractionSchema } from '@/lib/validation'

const anthropic = new Anthropic()

const SUPPORTED_IMAGE_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
])

function parseJsonObject(text: string) {
  const trimmed = text.trim()

  try {
    return JSON.parse(trimmed)
  } catch {
    const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/i)
    if (fenced) {
      return JSON.parse(fenced[1])
    }

    const start = trimmed.indexOf('{')
    const end = trimmed.lastIndexOf('}')
    if (start !== -1 && end !== -1 && end > start) {
      return JSON.parse(trimmed.slice(start, end + 1))
    }

    throw new Error('Model did not return valid JSON')
  }
}

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const formData = await req.formData()
  const image = formData.get('image')

  if (!(image instanceof File)) {
    return NextResponse.json({ error: 'No image file provided' }, { status: 400 })
  }

  if (!SUPPORTED_IMAGE_TYPES.has(image.type)) {
    return NextResponse.json({ error: 'Upload a JPG, PNG, or WebP image' }, { status: 400 })
  }

  if (image.size > 5 * 1024 * 1024) {
    return NextResponse.json({ error: 'Image file too large (max 5MB)' }, { status: 400 })
  }

  try {
    const bytes = await image.arrayBuffer()
    const base64 = Buffer.from(bytes).toString('base64')

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      messages: [{
        role: 'user',
        content: [
          {
            type: 'text',
            text: `Extract client intake fields from this form image.

Return ONLY valid JSON with this shape:
{
  "first_name": "string or null",
  "last_name": "string or null",
  "date_of_birth": "YYYY-MM-DD or null",
  "phone": "string or null",
  "email": "string or null",
  "language": "string or null",
  "gender": "string or null",
  "household_size": "number or null"
}

Rules:
- Use null when a field is missing or unclear
- Normalize date_of_birth to YYYY-MM-DD when possible
- Do not guess names or numbers if they are unreadable
- Ignore unrelated text and form instructions`,
          },
          {
            type: 'image',
            source: {
              type: 'base64',
              media_type: image.type as 'image/jpeg' | 'image/png' | 'image/webp',
              data: base64,
            },
          },
        ],
      }],
    })

    const content = message.content[0]
    if (content.type !== 'text') throw new Error('Unexpected response type')

    const extracted = intakeImageExtractionSchema.parse(parseJsonObject(content.text))

    return NextResponse.json({
      data: {
        first_name: extracted.first_name ?? '',
        last_name: extracted.last_name ?? '',
        date_of_birth: extracted.date_of_birth ?? '',
        phone: extracted.phone ?? '',
        email: extracted.email ?? '',
        language: extracted.language ?? '',
        gender: extracted.gender ?? '',
        household_size: extracted.household_size ?? '',
      },
    })
  } catch (e: any) {
    console.error('Intake from image error:', e)
    return NextResponse.json({ error: 'Failed to extract intake fields from image' }, { status: 500 })
  }
}
