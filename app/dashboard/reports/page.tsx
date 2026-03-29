import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'
import { redirect } from 'next/navigation'
import FunderReportGenerator from '@/components/FunderReportGenerator'

export default async function ReportsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user!.id).single()
  if (profile?.role !== 'admin') redirect('/dashboard')

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Funder Reports</h1>
        <p className="text-muted-foreground">
          Build a draft quarterly report from the case management data already in the system.
        </p>
      </div>
      <FunderReportGenerator />
    </div>
  )
}
