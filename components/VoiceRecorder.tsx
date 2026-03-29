'use client'
import { useState, useRef, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Mic, MicOff, Loader2, Square } from 'lucide-react'

interface VoiceRecorderProps {
  onTranscript: (transcript: string) => void
  onStructured?: (data: StructuredNote) => void
  serviceTypes?: string[]
}

export interface StructuredNote {
  summary: string
  service_type: string
  action_items: string[]
  risk_flags: string[]
  suggested_followup_date: string | null
  mood_assessment: string
}

type RecorderState = 'idle' | 'recording' | 'processing'

export default function VoiceRecorder({ onTranscript, onStructured, serviceTypes = [] }: VoiceRecorderProps) {
  const [state, setState] = useState<RecorderState>('idle')
  const [error, setError] = useState<string | null>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])

  const startRecording = useCallback(async () => {
    setError(null)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mr = new MediaRecorder(stream, { mimeType: 'audio/webm' })
      mediaRecorderRef.current = mr
      chunksRef.current = []

      mr.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data) }
      mr.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop())
        setState('processing')

        const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
        const formData = new FormData()
        formData.append('audio', blob, 'recording.webm')

        try {
          const res = await fetch('/api/ai/transcribe', { method: 'POST', body: formData })
          if (!res.ok) throw new Error('Transcription failed')
          const { transcript } = await res.json()
          onTranscript(transcript)

          if (onStructured && transcript) {
            const res2 = await fetch('/api/ai/structure-note', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ transcript, serviceTypes }),
            })
            if (res2.ok) {
              const structured = await res2.json()
              onStructured(structured)
            }
          }
        } catch (e: any) {
          setError(e.message || 'Processing failed')
        } finally {
          setState('idle')
        }
      }

      mr.start()
      setState('recording')
    } catch {
      setError('Microphone access denied. Please allow microphone access.')
      setState('idle')
    }
  }, [onTranscript, onStructured, serviceTypes])

  const stopRecording = useCallback(() => {
    mediaRecorderRef.current?.stop()
  }, [])

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-3">
        {state === 'idle' && (
          <Button
            type="button"
            variant="outline"
            onClick={startRecording}
            className="gap-2 border-primary text-primary hover:bg-primary hover:text-primary-foreground"
            aria-label="Start voice recording"
          >
            <Mic className="h-4 w-4" aria-hidden="true" />
            Record Voice Note
          </Button>
        )}

        {state === 'recording' && (
          <Button
            type="button"
            variant="destructive"
            onClick={stopRecording}
            className="gap-2 animate-pulse"
            aria-label="Stop recording"
            aria-live="polite"
          >
            <Square className="h-4 w-4" aria-hidden="true" />
            Stop Recording
          </Button>
        )}

        {state === 'processing' && (
          <Button type="button" variant="outline" disabled aria-live="polite">
            <Loader2 className="h-4 w-4 animate-spin mr-2" aria-hidden="true" />
            Transcribing &amp; structuring…
          </Button>
        )}

        {state === 'recording' && (
          <span className="flex items-center gap-1.5 text-sm text-red-600 font-medium" role="status" aria-live="polite">
            <MicOff className="h-3 w-3" aria-hidden="true" />
            Recording…
          </span>
        )}
      </div>

      {error && (
        <p role="alert" className="text-sm text-red-600">{error}</p>
      )}

      <p className="text-xs text-muted-foreground">
        Speak your case notes. AI will transcribe and auto-fill the form fields.
      </p>
    </div>
  )
}
