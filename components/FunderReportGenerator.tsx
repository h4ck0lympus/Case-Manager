'use client'
import { useState } from 'react'
import type { ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Loader2, FileText, RefreshCw } from 'lucide-react'

type ReportMeta = {
  quarter: number
  year: number
  label: string
  totalServices: number
  totalClients: number
}

function renderInline(text: string): ReactNode[] {
  return text.split(/(\*\*.*?\*\*)/g).filter(Boolean).map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={index}>{part.slice(2, -2)}</strong>
    }
    return <span key={index}>{part}</span>
  })
}

function renderReport(markdown: string) {
  const normalized = markdown
    .replace(/\r\n/g, '\n')
    .replace(/^```(?:markdown|md)?\s*/i, '')
    .replace(/\s*```$/, '')
  const lines = normalized.split('\n')
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
              <tr key={rowIndex}>
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

    if (/^#{1,3}\s+(.*)$/.test(line)) {
      flushParagraph()
      flushBullets()
      flushTable()
      const text = line.replace(/^#{1,3}\s+/, '')
      elements.push(
        <h3 key={`h-${elements.length}`} className="mt-6 text-base font-semibold text-foreground first:mt-0">
          {text}
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

function getCurrentQuarter() {
  const now = new Date()
  return Math.floor(now.getMonth() / 3) + 1
}

export default function FunderReportGenerator() {
  const now = new Date()
  const [quarter, setQuarter] = useState(String(getCurrentQuarter()))
  const [year, setYear] = useState(String(now.getFullYear()))
  const [report, setReport] = useState<string | null>(null)
  const [meta, setMeta] = useState<ReportMeta | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function generate() {
    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/ai/funder-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          quarter: Number(quarter),
          year: Number(year),
        }),
      })

      const body = await res.json().catch(() => null)
      if (!res.ok) {
        throw new Error(body?.error ?? 'Failed to generate report')
      }

      setReport(body.report)
      setMeta(body.meta)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to generate report')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card className="border-primary/20 bg-primary/5">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="h-4 w-4 text-primary" aria-hidden="true" />
            AI Funder Report
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Generate a draft quarterly narrative report from client and service data.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="quarter">Quarter</Label>
              <Select value={quarter} onValueChange={setQuarter}>
                <SelectTrigger id="quarter" aria-label="Select quarter">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Q1</SelectItem>
                  <SelectItem value="2">Q2</SelectItem>
                  <SelectItem value="3">Q3</SelectItem>
                  <SelectItem value="4">Q4</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="year">Year</Label>
              <Select value={year} onValueChange={setYear}>
                <SelectTrigger id="year" aria-label="Select year">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[now.getFullYear() - 1, now.getFullYear(), now.getFullYear() + 1].map((value) => (
                    <SelectItem key={value} value={String(value)}>{value}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button onClick={generate} disabled={loading}>
              {loading
                ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                : <FileText className="h-4 w-4" aria-hidden="true" />}
              {loading ? 'Generating report…' : 'Generate report'}
            </Button>
            {report && (
              <Button variant="outline" onClick={generate} disabled={loading}>
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} aria-hidden="true" />
                Regenerate
              </Button>
            )}
          </div>

          {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
        </CardContent>
      </Card>

      {meta && report && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">{meta.label} Draft Report</CardTitle>
            <p className="text-sm text-muted-foreground">
              {meta.totalClients} clients served and {meta.totalServices} services logged in this period.
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 text-sm" aria-live="polite" aria-label="AI generated funder report">
              {renderReport(report)}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
