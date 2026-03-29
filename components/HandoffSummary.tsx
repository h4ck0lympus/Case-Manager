'use client'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, Sparkles, RefreshCw } from 'lucide-react'
import TTSButton from './TTSButton'

export default function HandoffSummary({ clientId, clientName }: { clientId: string; clientName: string }) {
  const [summary, setSummary] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function generate() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/ai/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Failed to generate summary')
      }
      const data = await res.json()
      setSummary(data.summary)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  if (!summary) {
    return (
      <Card className="border-dashed border-2 border-primary/30 bg-primary/5">
        <CardContent className="p-6 flex flex-col items-center text-center gap-3">
          <Sparkles className="h-8 w-8 text-primary" aria-hidden="true" />
          <div>
            <p className="font-medium">AI Handoff Summary</p>
            <p className="text-sm text-muted-foreground">
              Generate a structured clinical brief from all of {clientName.split(' ')[0]}&apos;s case notes
            </p>
          </div>
          {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
          <Button onClick={generate} disabled={loading} aria-label="Generate AI handoff summary">
            {loading
              ? <><Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> Generating…</>
              : <><Sparkles className="h-4 w-4" aria-hidden="true" /> Generate Handoff Summary</>}
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" aria-hidden="true" />
            AI Handoff Summary
          </CardTitle>
          <div className="flex items-center gap-1">
            <TTSButton
              text={summary
                .replace(/^## .*/gm, '')
                .replace(/\*\*(.*?)\*\*/g, '$1')
                .replace(/^- /gm, '')
                .replace(/\n{2,}/g, '\n')
                .trim()
                .slice(0, 2900)}
              label="Read summary aloud"
            />
            <Button
              variant="ghost"
              size="sm"
              onClick={generate}
              disabled={loading}
              aria-label="Regenerate summary"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} aria-hidden="true" />
              <span className="sr-only">Regenerate</span>
            </Button>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">AI-generated — always review before sharing</p>
      </CardHeader>
      <CardContent>
        <div
          className="prose prose-sm max-w-none text-sm"
          aria-live="polite"
          aria-label="AI generated handoff summary"
          dangerouslySetInnerHTML={{
            __html: summary
              .replace(/## (.*)/g, '<h3 class="font-semibold text-base mt-4 mb-1">$1</h3>')
              .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
              .replace(/^- (.*)/gm, '<li class="ml-4 list-disc">$1</li>')
              .replace(/\n\n/g, '<br/>')
          }}
        />
      </CardContent>
    </Card>
  )
}
