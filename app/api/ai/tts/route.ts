import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { ElevenLabsClient } from 'elevenlabs'
import { ttsSchema } from '@/lib/validation'

type ElevenLabsErrorDetail = {
  type?: string
  code?: string
  message?: string
  request_id?: string
  param?: string
}

async function readErrorBody(body: unknown): Promise<unknown> {
  if (!body) return null
  if (typeof body === 'object' && 'detail' in (body as Record<string, unknown>)) return body
  if (!(body instanceof ReadableStream)) return body

  try {
    const text = await new Response(body).text()
    if (!text) return null

    try {
      return JSON.parse(text)
    } catch {
      return { detail: { message: text } }
    }
  } catch {
    return null
  }
}

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  if (!process.env.ELEVENLABS_API_KEY) {
    return NextResponse.json({ error: 'ElevenLabs API key not configured' }, { status: 500 })
  }

  const body = await req.json()
  const parsed = ttsSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input' }, { status: 400 })
  }

  try {
    const client = new ElevenLabsClient({ apiKey: process.env.ELEVENLABS_API_KEY })
    const voiceId = process.env.ELEVENLABS_TTS_VOICE_ID ?? 'JBFqnCBsd6RMkjVDRZzb'
    const modelId = process.env.ELEVENLABS_TTS_MODEL_ID ?? 'eleven_multilingual_v2'

    const audioStream = await client.textToSpeech.convert(voiceId, {
      text: parsed.data.text,
      model_id: modelId,
      voice_settings: { stability: 0.5, similarity_boost: 0.75 },
    })

    const chunks: Buffer[] = []
    for await (const chunk of audioStream) {
      chunks.push(Buffer.from(chunk))
    }
    const audioBuffer = Buffer.concat(chunks)

    return new NextResponse(audioBuffer, {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Content-Length': audioBuffer.length.toString(),
      },
    })
  } catch (e: any) {
    const providerBody = await readErrorBody(e?.body)
    const detail = ((providerBody as { detail?: ElevenLabsErrorDetail } | null)?.detail ?? null)
    const status = typeof e?.statusCode === 'number' ? e.statusCode : 500
    const message = detail?.message ?? e?.message ?? 'TTS failed'

    console.error('TTS error:', {
      status,
      message,
      code: detail?.code,
      type: detail?.type,
      requestId: detail?.request_id,
      param: detail?.param,
      body: providerBody,
    })

    return NextResponse.json(
      {
        error: message,
        code: detail?.code,
        type: detail?.type,
        requestId: detail?.request_id,
      },
      { status },
    )
  }
}
