'use client'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Volume2, Loader2, VolumeX } from 'lucide-react'

export default function TTSButton({ text, label = 'Read aloud' }: { text: string; label?: string }) {
  const [loading, setLoading] = useState(false)
  const [playing, setPlaying] = useState(false)
  const [audio, setAudio] = useState<HTMLAudioElement | null>(null)
  const [error, setError] = useState(false)

  async function handleClick() {
    if (playing && audio) {
      audio.pause()
      audio.currentTime = 0
      setPlaying(false)
      return
    }

    setLoading(true)
    setError(false)
    try {
      const res = await fetch('/api/ai/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      })
      if (!res.ok) throw new Error('TTS failed')

      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const audioEl = new Audio(url)
      audioEl.onended = () => { setPlaying(false); URL.revokeObjectURL(url) }
      setAudio(audioEl)
      setPlaying(true)
      await audioEl.play()
    } catch (e) {
      console.error('TTS error:', e)
      setError(true)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      onClick={handleClick}
      disabled={loading}
      aria-label={playing ? 'Stop reading' : label}
      className={`text-muted-foreground hover:text-foreground ${error ? 'text-red-500' : ''}`}
      title={error ? 'TTS failed — check API key' : label}
    >
      {loading
        ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
        : playing
          ? <VolumeX className="h-4 w-4" aria-hidden="true" />
          : <Volume2 className="h-4 w-4" aria-hidden="true" />}
      <span className="sr-only">{playing ? 'Stop' : label}</span>
    </Button>
  )
}
