import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { ElevenLabsClient } from 'elevenlabs'

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  if (!process.env.ELEVENLABS_API_KEY) {
    return NextResponse.json({ error: 'ElevenLabs API key not configured' }, { status: 500 })
  }

  const formData = await req.formData()
  const audio = formData.get('audio') as File | null

  if (!audio) return NextResponse.json({ error: 'No audio file provided' }, { status: 400 })

  if (audio.size > 10 * 1024 * 1024) {
    return NextResponse.json({ error: 'Audio file too large (max 10MB)' }, { status: 400 })
  }

  try {
    const client = new ElevenLabsClient({ apiKey: process.env.ELEVENLABS_API_KEY })
    const transcription = await client.speechToText.convert({
      file: audio,
      model_id: 'scribe_v1',
    })
    return NextResponse.json({ transcript: transcription.text })
  } catch (e: any) {
    console.error('ElevenLabs STT error:', e)
    return NextResponse.json({ error: 'Transcription failed' }, { status: 500 })
  }
}
