'use client'
import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { createServiceSchema, SERVICE_TYPES } from '@/lib/validation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Loader2, AlertTriangle } from 'lucide-react'
import VoiceRecorder, { type StructuredNote } from './VoiceRecorder'

type FormData = z.infer<typeof createServiceSchema>
interface ClientOption { id: string; first_name: string; last_name: string }

export default function ServiceForm({
  clients,
  defaultClientId,
}: {
  clients: ClientOption[]
  defaultClientId?: string
}) {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [aiData, setAiData] = useState<StructuredNote | null>(null)

  const { register, handleSubmit, setValue, watch, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(createServiceSchema) as any,
    defaultValues: {
      client_id: defaultClientId ?? '',
      service_date: new Date().toISOString().split('T')[0],
      ai_action_items: [],
      ai_risk_flags: [],
    },
  })

  const handleTranscript = useCallback((transcript: string) => {
    const current = watch('notes')
    setValue('notes', current ? `${current}\n\n[Voice] ${transcript}` : transcript)
  }, [setValue, watch])

  const handleStructured = useCallback((data: StructuredNote) => {
    setAiData(data)
    if (data.summary) setValue('ai_summary', data.summary)
    if (data.service_type && SERVICE_TYPES.includes(data.service_type as any)) {
      setValue('service_type', data.service_type as any)
    }
    if (data.action_items) setValue('ai_action_items', data.action_items)
    if (data.risk_flags) setValue('ai_risk_flags', data.risk_flags)
    if (data.suggested_followup_date) setValue('ai_suggested_followup', data.suggested_followup_date)
  }, [setValue])

  async function onSubmit(data: FormData) {
    setError(null)
    const res = await fetch('/api/services', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (!res.ok) {
      const err = await res.json()
      setError(err.error || 'Failed to save service entry')
      return
    }
    router.push(`/dashboard/clients/${data.client_id}`)
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate aria-label="Log service entry form">
      <Card>
        <CardContent className="p-6 space-y-5">
          {error && (
            <div role="alert" className="rounded-md bg-red-50 border border-red-200 p-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {/* Client select */}
          <div className="space-y-1.5">
            <Label htmlFor="client_id">Client *</Label>
            <Select
              defaultValue={defaultClientId}
              onValueChange={(v) => setValue('client_id', v)}
            >
              <SelectTrigger id="client_id" aria-required="true" aria-label="Select client">
                <SelectValue placeholder="Select a client…" />
              </SelectTrigger>
              <SelectContent>
                {clients.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.first_name} {c.last_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.client_id && (
              <p role="alert" className="text-xs text-red-600">{errors.client_id.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="service_date">Service Date *</Label>
              <Input
                id="service_date"
                type="date"
                {...register('service_date')}
                aria-required="true"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="service_type">Service Type *</Label>
              <Select
                defaultValue={aiData?.service_type && SERVICE_TYPES.includes(aiData.service_type as any) ? aiData.service_type : undefined}
                onValueChange={(v) => setValue('service_type', v as any)}
              >
                <SelectTrigger id="service_type" aria-required="true" aria-label="Select service type">
                  <SelectValue placeholder="Select type…" />
                </SelectTrigger>
                <SelectContent>
                  {SERVICE_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
              {errors.service_type && (
                <p role="alert" className="text-xs text-red-600">{errors.service_type.message}</p>
              )}
            </div>
          </div>

          {/* Voice recorder */}
          <div className="space-y-1.5">
            <Label>Voice Note</Label>
            <VoiceRecorder
              onTranscript={handleTranscript}
              onStructured={handleStructured}
              serviceTypes={[...SERVICE_TYPES]}
            />
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              {...register('notes')}
              placeholder="Enter case notes manually or use voice recording above…"
              className="min-h-[120px]"
            />
          </div>

          {/* AI structured output preview */}
          {aiData && (
            <div className="rounded-md border border-blue-200 bg-blue-50 p-4 space-y-3">
              <p className="text-sm font-medium text-blue-800 flex items-center gap-1">
                ✨ AI structured your note
              </p>

              {aiData.summary && (
                <div>
                  <p className="text-xs font-medium text-blue-700">Summary</p>
                  <p className="text-sm text-blue-900">{aiData.summary}</p>
                </div>
              )}

              {aiData.risk_flags && aiData.risk_flags.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-red-700 flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3" aria-hidden="true" /> Risk Flags
                  </p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {aiData.risk_flags.map((f, i) => (
                      <Badge key={i} variant="danger" className="text-xs">{f}</Badge>
                    ))}
                  </div>
                </div>
              )}

              {aiData.action_items && aiData.action_items.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-blue-700">Action Items</p>
                  <ul className="mt-1 space-y-0.5">
                    {aiData.action_items.map((item, i) => (
                      <li key={i} className="text-sm text-blue-900 flex items-start gap-1">
                        <span className="mt-1 h-1.5 w-1.5 rounded-full bg-blue-500 flex-shrink-0" aria-hidden="true" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {aiData.suggested_followup_date && (
                <p className="text-xs text-blue-700">
                  Suggested follow-up: <strong>{aiData.suggested_followup_date}</strong>
                </p>
              )}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
              {isSubmitting ? 'Saving…' : 'Save Service Entry'}
            </Button>
            <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
          </div>
        </CardContent>
      </Card>
    </form>
  )
}
