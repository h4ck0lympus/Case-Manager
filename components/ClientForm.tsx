'use client'
import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { createClientSchema } from '@/lib/validation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Loader2, ScanText } from 'lucide-react'

type FormData = z.infer<typeof createClientSchema>

export default function ClientForm() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [prefillError, setPrefillError] = useState<string | null>(null)
  const [prefillLoading, setPrefillLoading] = useState(false)
  const [prefillApplied, setPrefillApplied] = useState(false)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(createClientSchema) as any,
    defaultValues: { language: 'English' },
  })

  const language = watch('language')
  const gender = watch('gender')

  async function handleImagePrefill(file: File) {
    setPrefillLoading(true)
    setPrefillError(null)
    setPrefillApplied(false)

    try {
      const formData = new FormData()
      formData.append('image', file)

      const res = await fetch('/api/ai/intake-from-image', {
        method: 'POST',
        body: formData,
      })

      const body = await res.json().catch(() => null)
      if (!res.ok) {
        throw new Error(body?.error ?? 'Failed to scan intake form')
      }

      const data = body?.data ?? {}
      const fields = Object.entries(data).filter(([, value]) => value !== '' && value != null)

      if (fields.length === 0) {
        throw new Error('No usable client fields were found in that image')
      }

      for (const [key, value] of fields) {
        setValue(key as keyof FormData, value as FormData[keyof FormData], { shouldValidate: true })
      }

      setPrefillApplied(true)
    } catch (e) {
      setPrefillError(e instanceof Error ? e.message : 'Failed to scan intake form')
    } finally {
      setPrefillLoading(false)
    }
  }

  async function onSubmit(data: FormData) {
    setError(null)
    const res = await fetch('/api/clients', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (!res.ok) {
      const err = await res.json()
      setError(err.error || 'Failed to create client')
      return
    }
    const { id } = await res.json()
    router.push(`/dashboard/clients/${id}`)
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate aria-label="New client registration form">
      <Card>
        <CardContent className="p-6 space-y-5">
          {error && (
            <div role="alert" className="rounded-md bg-red-50 border border-red-200 p-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="rounded-md border border-blue-200 bg-blue-50 p-4 space-y-3">
            <div>
              <p className="text-sm font-medium text-blue-900">Photo to intake</p>
              <p className="text-sm text-blue-800">
                Upload a photo of a paper intake form. AI will prefill the fields below for review.
              </p>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) void handleImagePrefill(file)
                e.currentTarget.value = ''
              }}
            />
            <div className="flex flex-wrap items-center gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={prefillLoading}
              >
                {prefillLoading
                  ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                  : <ScanText className="h-4 w-4" aria-hidden="true" />}
                {prefillLoading ? 'Scanning form…' : 'Upload intake photo'}
              </Button>
              {prefillApplied && <p className="text-sm text-blue-800">Fields updated. Review and save.</p>}
            </div>
            {prefillError && (
              <p role="alert" className="text-sm text-red-700">{prefillError}</p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="first_name">First Name *</Label>
              <Input
                id="first_name"
                {...register('first_name')}
                aria-required="true"
                aria-describedby={errors.first_name ? 'first_name_error' : undefined}
                aria-invalid={!!errors.first_name}
              />
              {errors.first_name && (
                <p id="first_name_error" role="alert" className="text-xs text-red-600">{errors.first_name.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="last_name">Last Name *</Label>
              <Input
                id="last_name"
                {...register('last_name')}
                aria-required="true"
                aria-describedby={errors.last_name ? 'last_name_error' : undefined}
                aria-invalid={!!errors.last_name}
              />
              {errors.last_name && (
                <p id="last_name_error" role="alert" className="text-xs text-red-600">{errors.last_name.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="date_of_birth">Date of Birth</Label>
            <Input id="date_of_birth" type="date" {...register('date_of_birth')} />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" type="tel" {...register('phone')} placeholder="480-555-0100" autoComplete="tel" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                {...register('email')}
                placeholder="client@example.com"
                autoComplete="email"
                aria-describedby={errors.email ? 'email_error' : undefined}
                aria-invalid={!!errors.email}
              />
              {errors.email && (
                <p id="email_error" role="alert" className="text-xs text-red-600">{errors.email.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="language">Preferred Language</Label>
              <Select value={language ?? 'English'} onValueChange={(v) => setValue('language', v, { shouldValidate: true })}>
                <SelectTrigger id="language" aria-label="Select preferred language">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {['English', 'Spanish', 'French', 'Portuguese', 'Arabic', 'Somali', 'Other'].map((l) => (
                    <SelectItem key={l} value={l}>{l}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="gender">Gender</Label>
              <Select value={gender ?? undefined} onValueChange={(v) => setValue('gender', v, { shouldValidate: true })}>
                <SelectTrigger id="gender" aria-label="Select gender">
                  <SelectValue placeholder="Select…" />
                </SelectTrigger>
                <SelectContent>
                  {['Female', 'Male', 'Non-binary', 'Prefer not to say', 'Other'].map((g) => (
                    <SelectItem key={g} value={g}>{g}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="household_size">Household Size</Label>
              <Input
                id="household_size"
                type="number"
                min={1}
                max={20}
                {...register('household_size')}
                placeholder="1"
              />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
              {isSubmitting ? 'Saving…' : 'Register Client'}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push('/dashboard/clients')}
            >
              Cancel
            </Button>
          </div>
        </CardContent>
      </Card>
    </form>
  )
}
