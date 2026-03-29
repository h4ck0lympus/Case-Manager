import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'
import { redirect } from 'next/navigation'
import ServiceForm from '@/components/ServiceForm'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default async function NewServicePage({ searchParams }: { searchParams: Promise<{ client_id?: string }> }) {
  const supabase = await createClient()
  const { client_id } = await searchParams

  let client = null
  if (client_id) {
    const { data } = await supabase.from('clients').select('id, first_name, last_name').eq('id', client_id).single()
    client = data
  }

  const { data: clients } = await supabase
    .from('clients').select('id, first_name, last_name').eq('is_active', true).order('last_name')

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <Link
          href={client ? `/dashboard/clients/${client.id}` : '/dashboard/clients'}
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground focus:text-foreground focus:outline-none mb-4"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          {client ? `Back to ${client.first_name} ${client.last_name}` : 'Back to Clients'}
        </Link>
        <h1 className="text-2xl font-bold">Log Service Entry</h1>
        <p className="text-muted-foreground">Record a service or interaction with a client</p>
      </div>
      <ServiceForm clients={clients ?? []} defaultClientId={client_id} />
    </div>
  )
}
