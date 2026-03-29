import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, Phone, Mail, Home, Languages, ClipboardPlus, CalendarDays } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import HandoffSummary from '@/components/HandoffSummary'
import TTSButton from '@/components/TTSButton'

export default async function ClientProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient()
  const { id } = await params

  const { data: client } = await supabase.from('clients').select('*').eq('id', id).single()
  if (!client) notFound()

  const { data: services } = await supabase
    .from('service_entries')
    .select('*')
    .eq('client_id', id)
    .order('service_date', { ascending: false })

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <Link
          href="/dashboard/clients"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground focus:text-foreground focus:outline-none mb-4"
          aria-label="Back to clients"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Back to Clients
        </Link>

        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <div
              className="h-14 w-14 rounded-full bg-primary/10 text-primary text-xl font-bold flex items-center justify-center"
              aria-hidden="true"
            >
              {client.first_name[0]}{client.last_name[0]}
            </div>
            <div>
              <h1 className="text-2xl font-bold">{client.first_name} {client.last_name}</h1>
              <p className="text-muted-foreground">Client since {formatDate(client.created_at)}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button asChild variant="outline">
              <Link href={`/dashboard/calendar?client_id=${client.id}`}>
                <CalendarDays className="h-4 w-4" aria-hidden="true" />
                Schedule
              </Link>
            </Button>
            <Button asChild>
              <Link href={`/dashboard/services/new?client_id=${client.id}`}>
                <ClipboardPlus className="h-4 w-4" aria-hidden="true" />
                Log Service
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Demographics */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Demographics</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-4 text-sm">
            {client.date_of_birth && (
              <div>
                <dt className="text-muted-foreground">Date of Birth</dt>
                <dd className="font-medium">{formatDate(client.date_of_birth)}</dd>
              </div>
            )}
            {client.gender && (
              <div>
                <dt className="text-muted-foreground">Gender</dt>
                <dd className="font-medium">{client.gender}</dd>
              </div>
            )}
            {client.language && (
              <div>
                <dt className="flex items-center gap-1 text-muted-foreground">
                  <Languages className="h-3 w-3" aria-hidden="true" />
                  Language
                </dt>
                <dd className="font-medium">{client.language}</dd>
              </div>
            )}
            {client.household_size && (
              <div>
                <dt className="flex items-center gap-1 text-muted-foreground">
                  <Home className="h-3 w-3" aria-hidden="true" />
                  Household
                </dt>
                <dd className="font-medium">{client.household_size} people</dd>
              </div>
            )}
            {client.phone && (
              <div>
                <dt className="flex items-center gap-1 text-muted-foreground">
                  <Phone className="h-3 w-3" aria-hidden="true" />
                  Phone
                </dt>
                <dd className="font-medium">
                  <a href={`tel:${client.phone}`} className="hover:underline">{client.phone}</a>
                </dd>
              </div>
            )}
            {client.email && (
              <div>
                <dt className="flex items-center gap-1 text-muted-foreground">
                  <Mail className="h-3 w-3" aria-hidden="true" />
                  Email
                </dt>
                <dd className="font-medium">
                  <a href={`mailto:${client.email}`} className="hover:underline truncate block max-w-[200px]">{client.email}</a>
                </dd>
              </div>
            )}
          </dl>
        </CardContent>
      </Card>

      {/* AI Handoff Summary */}
      <HandoffSummary clientId={client.id} clientName={`${client.first_name} ${client.last_name}`} />

      {/* Service History */}
      <div>
        <h2 className="text-lg font-semibold mb-3">Service History ({services?.length ?? 0} entries)</h2>
        {services && services.length > 0 ? (
          <div className="space-y-4" role="list" aria-label="Service history">
            {services.map((s: any) => (
              <Card key={s.id} role="listitem">
                <CardContent className="p-4">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">{s.service_type}</Badge>
                      <span className="text-sm text-muted-foreground">{formatDate(s.service_date)}</span>
                    </div>
                    {s.notes && <TTSButton text={s.notes} label="Read notes aloud" />}
                  </div>

                  {s.ai_summary && (
                    <div className="mb-3 p-3 rounded-md bg-blue-50 border border-blue-100">
                      <p className="text-xs font-medium text-blue-700 mb-1">AI Summary</p>
                      <p className="text-sm text-blue-900">{s.ai_summary}</p>
                    </div>
                  )}

                  {s.notes && (
                    <div className="mb-3">
                      <p className="text-xs font-medium text-muted-foreground mb-1">Notes</p>
                      <p className="text-sm whitespace-pre-wrap">{s.notes}</p>
                    </div>
                  )}

                  <div className="flex flex-wrap gap-2">
                    {s.ai_risk_flags && (s.ai_risk_flags as string[]).length > 0 && (
                      <div className="flex flex-wrap gap-1" aria-label="Risk flags">
                        {(s.ai_risk_flags as string[]).map((flag: string, i: number) => (
                          <Badge key={i} variant="danger" className="text-xs">{flag}</Badge>
                        ))}
                      </div>
                    )}
                    {s.ai_action_items && (s.ai_action_items as string[]).length > 0 && (
                      <div className="flex flex-wrap gap-1" aria-label="Action items">
                        {(s.ai_action_items as string[]).map((item: string, i: number) => (
                          <Badge key={i} variant="outline" className="text-xs">{item}</Badge>
                        ))}
                      </div>
                    )}
                  </div>

                  {s.ai_suggested_followup && (
                    <p className="text-xs text-muted-foreground mt-2">
                      Suggested follow-up: {formatDate(s.ai_suggested_followup)}
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-muted-foreground mb-4">No services logged for this client yet.</p>
              <Button asChild>
                <Link href={`/dashboard/services/new?client_id=${client.id}`}>
                  <ClipboardPlus className="h-4 w-4" aria-hidden="true" />
                  Log First Service
                </Link>
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
