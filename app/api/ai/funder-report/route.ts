import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import Anthropic from '@anthropic-ai/sdk'
import { funderReportSchema } from '@/lib/validation'

const anthropic = new Anthropic()

function getQuarterRange(year: number, quarter: number) {
  const startMonth = (quarter - 1) * 3
  const start = new Date(Date.UTC(year, startMonth, 1))
  const end = new Date(Date.UTC(year, startMonth + 3, 0))

  return {
    startDate: start.toISOString().slice(0, 10),
    endDate: end.toISOString().slice(0, 10),
    label: `Q${quarter} ${year}`,
  }
}

function countBy<T extends string>(items: T[]) {
  const counts = new Map<string, number>()
  for (const item of items) {
    counts.set(item, (counts.get(item) ?? 0) + 1)
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([label, count]) => ({ label, count }))
}

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await req.json()
  const parsed = funderReportSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid report period' }, { status: 400 })
  }

  const { quarter, year } = parsed.data
  const { startDate, endDate, label } = getQuarterRange(year, quarter)

  const { data: services, error: servicesError } = await supabase
    .from('service_entries')
    .select(`
      id,
      client_id,
      service_date,
      service_type,
      ai_summary,
      notes,
      ai_risk_flags,
      ai_action_items,
      ai_suggested_followup,
      clients (
        first_name,
        last_name,
        language,
        gender,
        household_size
      )
    `)
    .gte('service_date', startDate)
    .lte('service_date', endDate)
    .order('service_date', { ascending: true })

  if (servicesError) {
    return NextResponse.json({ error: servicesError.message }, { status: 500 })
  }

  if (!services || services.length === 0) {
    return NextResponse.json({ error: `No services found for ${label}` }, { status: 400 })
  }

  const uniqueClientIds = [...new Set(services.map((service) => service.client_id))]
  const languageCounts = countBy(
    services.map((service: any) => service.clients?.language || 'Unknown'),
  )
  const genderCounts = countBy(
    services.map((service: any) => service.clients?.gender || 'Unknown'),
  )
  const serviceTypeCounts = countBy(
    services.map((service) => service.service_type || 'Other'),
  )
  const riskFlags = countBy(
    services.flatMap((service: any) => Array.isArray(service.ai_risk_flags) ? service.ai_risk_flags : []),
  )
  const followupsScheduled = services.filter((service) => !!service.ai_suggested_followup).length
  const averageHousehold = (() => {
    const sizes = services
      .map((service: any) => service.clients?.household_size)
      .filter((value): value is number => typeof value === 'number')
    if (sizes.length === 0) return null
    return (sizes.reduce((sum, value) => sum + value, 0) / sizes.length).toFixed(1)
  })()

  const sampleNarratives = services.slice(0, 8).map((service: any) => {
    const clientName = `${service.clients?.first_name ?? 'Unknown'} ${service.clients?.last_name ?? 'Client'}`
    const note = service.ai_summary || service.notes || '(no note)'
    return `- ${service.service_date} | ${clientName} | ${service.service_type} | ${note}`
  }).join('\n')

  const stats = {
    report_period: label,
    date_range: `${startDate} to ${endDate}`,
    total_services: services.length,
    unique_clients_served: uniqueClientIds.length,
    followups_scheduled: followupsScheduled,
    average_household_size: averageHousehold ?? 'Unknown',
    service_types: serviceTypeCounts,
    languages: languageCounts,
    genders: genderCounts,
    risk_flags: riskFlags,
  }

  try {
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1800,
      messages: [{
        role: 'user',
        content: `Write a draft quarterly nonprofit funder report in plain markdown for ${label}.

Use this exact structure:
## Executive Summary
## Population Served
## Services Delivered
## Outcomes and Client Needs
## Risks and Follow-up
## Next Quarter Priorities
## Data Tables

Rules:
- Keep the tone professional and factual
- Use short paragraphs and bullet lists
- Include at least two markdown tables in the Data Tables section
- Do not invent metrics that are not in the data
- Make reasonable narrative inferences only from the provided data
- Mention that the report is a draft generated from case management data

Structured data:
${JSON.stringify(stats, null, 2)}

Sample service records:
${sampleNarratives}`,
      }],
    })

    const content = message.content[0]
    if (content.type !== 'text') throw new Error('Unexpected response')

    return NextResponse.json({
      report: content.text,
      meta: {
        quarter,
        year,
        label,
        totalServices: services.length,
        totalClients: uniqueClientIds.length,
      },
    })
  } catch (e: any) {
    console.error('Funder report error:', e)
    return NextResponse.json({ error: 'Failed to generate funder report' }, { status: 500 })
  }
}
