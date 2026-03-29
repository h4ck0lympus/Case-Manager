'use client'
import { useState } from 'react'
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
import { Loader2 } from 'lucide-react'

type FormData = z.infer<typeof createClientSchema>

export default function ClientForm() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)

  const { register, handleSubmit, setValue, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(createClientSchema) as any,
    defaultValues: { language: 'English' },
  })

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
              <Select defaultValue="English" onValueChange={(v) => setValue('language', v)}>
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
              <Select onValueChange={(v) => setValue('gender', v)}>
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
