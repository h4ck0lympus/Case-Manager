'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { createAppointmentSchema } from '@/lib/validation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Loader2 } from 'lucide-react'

type FormData = z.infer<typeof createAppointmentSchema>
type ClientOption = { id: string; first_name: string; last_name: string }

function toLocalDateTimeValue(date: Date) {
  const adjusted = new Date(date.getTime() - date.getTimezoneOffset() * 60000)
  return adjusted.toISOString().slice(0, 16)
}

function toIsoValue(value?: string | null) {
  return value ? new Date(value).toISOString() : null
}

export default function AppointmentForm({
  clients,
  defaultClientId,
}: {
  clients: ClientOption[]
  defaultClientId?: string
}) {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(createAppointmentSchema) as any,
    defaultValues: {
      client_id: defaultClientId ?? '',
      starts_at: toLocalDateTimeValue(new Date(Date.now() + 60 * 60 * 1000)),
      ends_at: toLocalDateTimeValue(new Date(Date.now() + 90 * 60 * 1000)),
    },
  })

  async function onSubmit(data: FormData) {
    setError(null)

    const res = await fetch('/api/appointments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...data,
        starts_at: toIsoValue(data.starts_at),
        ends_at: toIsoValue(data.ends_at),
      }),
    })

    if (!res.ok) {
      const err = await res.json().catch(() => null)
      setError(err?.error || 'Failed to schedule appointment')
      return
    }

    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate aria-label="Schedule appointment form">
      <Card>
        <CardContent className="p-5 space-y-4">
          {error && (
            <div role="alert" className="rounded-md bg-red-50 border border-red-200 p-3 text-sm text-red-700">
              {typeof error === 'string' ? error : 'Failed to schedule appointment'}
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="client_id">Client *</Label>
            <Select value={watch('client_id')} onValueChange={(v) => setValue('client_id', v, { shouldValidate: true })}>
              <SelectTrigger id="client_id" aria-label="Select client">
                <SelectValue placeholder="Select a client…" />
              </SelectTrigger>
              <SelectContent>
                {clients.map((client) => (
                  <SelectItem key={client.id} value={client.id}>
                    {client.first_name} {client.last_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.client_id && <p role="alert" className="text-xs text-red-600">{errors.client_id.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="title">Title *</Label>
            <Input id="title" {...register('title')} placeholder="Follow-up appointment" />
            {errors.title && <p role="alert" className="text-xs text-red-600">{errors.title.message}</p>}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="starts_at">Starts *</Label>
              <Input id="starts_at" type="datetime-local" {...register('starts_at')} />
              {errors.starts_at && <p role="alert" className="text-xs text-red-600">{errors.starts_at.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ends_at">Ends</Label>
              <Input id="ends_at" type="datetime-local" {...register('ends_at')} />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="notes">Notes</Label>
            <Textarea id="notes" {...register('notes')} placeholder="Optional appointment notes" className="min-h-[90px]" />
          </div>

          <div className="flex gap-3">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
              {isSubmitting ? 'Scheduling…' : 'Schedule Appointment'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </form>
  )
}
