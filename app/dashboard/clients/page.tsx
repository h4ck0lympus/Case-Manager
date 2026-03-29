import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { UserPlus, Search, Users } from 'lucide-react'
import { getInitials, formatDate } from '@/lib/utils'

interface SearchParams { q?: string }

export default async function ClientsPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const supabase = await createClient()
  const { q } = await searchParams

  let query = supabase
    .from('clients')
    .select('*')
    .eq('is_active', true)
    .order('last_name', { ascending: true })

  if (q && q.trim()) {
    query = query.or(`first_name.ilike.%${q}%,last_name.ilike.%${q}%,email.ilike.%${q}%`)
  }

  const { data: clients } = await query

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Clients</h1>
          <p className="text-muted-foreground">{clients?.length ?? 0} active clients</p>
        </div>
        <Button asChild>
          <Link href="/dashboard/clients/new">
            <UserPlus className="h-4 w-4" aria-hidden="true" />
            New Client
          </Link>
        </Button>
      </div>

      {/* Search */}
      <form method="GET" role="search" aria-label="Search clients">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" aria-hidden="true" />
          <Input
            name="q"
            type="search"
            defaultValue={q}
            placeholder="Search by name or email…"
            className="pl-9"
            aria-label="Search clients by name or email"
          />
        </div>
      </form>

      {/* Client list */}
      {clients && clients.length > 0 ? (
        <div className="rounded-lg border overflow-hidden">
          <table className="w-full text-sm" role="grid" aria-label="Client list">
            <thead className="bg-muted/50">
              <tr>
                <th scope="col" className="px-4 py-3 text-left font-medium">Client</th>
                <th scope="col" className="px-4 py-3 text-left font-medium hidden sm:table-cell">Language</th>
                <th scope="col" className="px-4 py-3 text-left font-medium hidden md:table-cell">Household</th>
                <th scope="col" className="px-4 py-3 text-left font-medium hidden lg:table-cell">Added</th>
                <th scope="col" className="px-4 py-3 text-right font-medium">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {clients.map((client: any) => (
                <tr key={client.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div
                        className="h-8 w-8 rounded-full bg-primary/10 text-primary text-xs font-semibold flex items-center justify-center flex-shrink-0"
                        aria-hidden="true"
                      >
                        {getInitials(client.first_name, client.last_name)}
                      </div>
                      <div>
                        <p className="font-medium">{client.first_name} {client.last_name}</p>
                        {client.email && <p className="text-xs text-muted-foreground">{client.email}</p>}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell text-muted-foreground">{client.language ?? '—'}</td>
                  <td className="px-4 py-3 hidden md:table-cell text-muted-foreground">
                    {client.household_size ? `${client.household_size} people` : '—'}
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell text-muted-foreground">
                    {formatDate(client.created_at)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Button asChild variant="ghost" size="sm">
                      <Link href={`/dashboard/clients/${client.id}`} aria-label={`View ${client.first_name} ${client.last_name}`}>
                        View
                      </Link>
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="rounded-lg border bg-muted/20 p-12 text-center">
          <Users className="h-10 w-10 text-muted-foreground mx-auto mb-3" aria-hidden="true" />
          <p className="text-muted-foreground">
            {q ? `No clients found for "${q}"` : 'No clients yet. Add your first client.'}
          </p>
          {!q && (
            <Button asChild className="mt-4">
              <Link href="/dashboard/clients/new">
                <UserPlus className="h-4 w-4" aria-hidden="true" />
                Add Client
              </Link>
            </Button>
          )}
        </div>
      )}
    </div>
  )
}
