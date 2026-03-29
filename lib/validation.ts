import { z } from 'zod'

export const SERVICE_TYPES = [
  'Food Assistance',
  'Housing Support',
  'Counseling',
  'Job Training',
  'Crisis Intervention',
  'Crisis Follow-up',
  'Senior Services',
  'Medical Referral',
  'Legal Aid',
  'Childcare Assistance',
  'Transportation',
  'Mental Health',
  'Substance Use Support',
  'Financial Counseling',
  'Other',
] as const

export const createClientSchema = z.object({
  first_name: z.string().min(1, 'First name is required').max(100),
  last_name: z.string().min(1, 'Last name is required').max(100),
  date_of_birth: z.string().optional().nullable(),
  phone: z.string().max(20).optional().nullable(),
  email: z.string().email('Invalid email').optional().nullable().or(z.literal('')),
  language: z.string().max(50).default('English'),
  gender: z.string().max(50).optional().nullable(),
  household_size: z.coerce.number().int().min(1).max(20).optional().nullable(),
})

export const createServiceSchema = z.object({
  client_id: z.string().uuid('Invalid client ID'),
  service_date: z.string().min(1, 'Service date is required'),
  service_type: z.enum(SERVICE_TYPES, { errorMap: () => ({ message: 'Invalid service type' }) }),
  notes: z.string().max(5000).optional().nullable(),
  ai_summary: z.string().max(2000).optional().nullable(),
  ai_action_items: z.array(z.string()).default([]),
  ai_risk_flags: z.array(z.string()).default([]),
  ai_suggested_followup: z.string().optional().nullable(),
})

export const structureNoteSchema = z.object({
  transcript: z.string().min(1).max(5000),
  serviceTypes: z.array(z.string()).default([...SERVICE_TYPES]),
})

export const summarizeClientSchema = z.object({
  clientId: z.string().uuid(),
})

export const ttsSchema = z.object({
  text: z.string().min(1).max(3000),
})
