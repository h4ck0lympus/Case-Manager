import ClientForm from '@/components/ClientForm'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function NewClientPage() {
  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <Link
          href="/dashboard/clients"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground focus:text-foreground focus:outline-none mb-4"
          aria-label="Back to clients list"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Back to Clients
        </Link>
        <h1 className="text-2xl font-bold">New Client</h1>
        <p className="text-muted-foreground">Register a new client in the system</p>
      </div>
      <ClientForm />
    </div>
  )
}
