'use client'
import { useState } from 'react'
import type { ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, Sparkles, RefreshCw } from 'lucide-react'
import TTSButton from './TTSButton'

function renderInline(text: string): ReactNode[] {
  return text.split(/(\*\*.*?\*\*)/g).filter(Boolean).map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={index}>{part.slice(2, -2)}</strong>
    }

    return <span key={index}>{part}</span>
  })
}

function renderSummary(summary: string) {
  const lines = summary.replace(/\r\n/g, '\n').split('\n')
  const elements: ReactNode[] = []
  let paragraph: string[] = []
  let bullets: string[] = []
  let tableRows: string[][] = []

  const flushParagraph = () => {
    if (paragraph.length === 0) return
    elements.push(
      <p key={`p-${elements.length}`} className="leading-7 text-foreground/90">
        {renderInline(paragraph.join(' '))}
      </p>,
    )
    paragraph = []
  }

  const flushBullets = () => {
    if (bullets.length === 0) return
    elements.push(
      <ul key={`ul-${elements.length}`} className="ml-5 list-disc space-y-1 text-foreground/90">
        {bullets.map((item, index) => (
          <li key={index}>{renderInline(item)}</li>
        ))}
      </ul>,
    )
    bullets = []
  }

  const flushTable = () => {
    if (tableRows.length === 0) return
    const [header, ...rows] = tableRows
    elements.push(
      <div key={`table-${elements.length}`} className="overflow-x-auto rounded-md border">
        <table className="min-w-full border-collapse text-left text-sm">
          <thead className="bg-muted/50">
            <tr>
              {header.map((cell, index) => (
                <th key={index} className="border-b px-3 py-2 font-medium text-foreground">
                  {renderInline(cell)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, rowIndex) => (
              <tr key={rowIndex} className="align-top">
                {header.map((_, cellIndex) => (
                  <td key={cellIndex} className="border-t px-3 py-2 text-foreground/90">
                    {renderInline(row[cellIndex] ?? '')}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>,
    )
    tableRows = []
  }

  for (const rawLine of lines) {
    const line = rawLine.trim()

    if (!line) {
      flushParagraph()
      flushBullets()
      flushTable()
      continue
    }

    if (/^---+$/.test(line)) {
      flushParagraph()
      flushBullets()
      flushTable()
      elements.push(<hr key={`hr-${elements.length}`} className="my-4 border-border" />)
      continue
    }

    const heading = line.match(/^#{1,3}\s+(.*)$/)
    if (heading) {
      flushParagraph()
      flushBullets()
      flushTable()
      elements.push(
        <h3 key={`h-${elements.length}`} className="mt-6 text-base font-semibold text-foreground first:mt-0">
          {heading[1]}
        </h3>,
      )
      continue
    }

    const bullet = line.match(/^[-*]\s+(.*)$/)
    if (bullet) {
      flushParagraph()
      flushTable()
      bullets.push(bullet[1])
      continue
    }

    if (line.includes('|')) {
      flushParagraph()
      flushBullets()

      const cells = line
        .split('|')
        .map((cell) => cell.trim())
        .filter((cell, index, parts) => !(index === 0 && cell === '') && !(index === parts.length - 1 && cell === ''))

      const isDivider = cells.length > 0 && cells.every((cell) => /^:?-{3,}:?$/.test(cell))
      if (isDivider) continue

      tableRows.push(cells)
      continue
    }

    flushTable()
    paragraph.push(line)
  }

  flushParagraph()
  flushBullets()
  flushTable()

  return elements
}

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
        <div className="space-y-4 text-sm" aria-live="polite" aria-label="AI generated handoff summary">
          {renderSummary(summary)}
        </div>
      </CardContent>
    </Card>
  )
}
