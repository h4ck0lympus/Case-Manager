# CaseFlow

A case management tool built for nonprofits. Replaces spreadsheets with something that actually works.

Built for Opportunity Hack x WiCS @ ASU, March 2026. AI tools were used throughout development to move faster under hackathon time constraints.

**Live demo:** https://case-manager-oje1ealmc-hackolympus.vercel.app

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fyour-org%2Fcase-manager&env=NEXT_PUBLIC_SUPABASE_URL,NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,SUPABASE_SECRET_KEY,ANTHROPIC_API_KEY,ELEVENLABS_API_KEY&envDescription=Required%20API%20keys%20for%20Supabase%2C%20Anthropic%2C%20and%20ElevenLabs&project-name=case-manager&repository-name=case-manager)

---

## What it does

Case workers spend a lot of time on documentation. This tool cuts that down. You can speak a note out loud, and the app turns it into a structured record with a service type, summary, action items, risk flags, and a suggested follow-up date.

It also reads notes back aloud, which helps staff who prefer not to read from a screen. And it can generate a handoff brief from a client's full service history in one click.

Every data change is logged to an audit trail that uses SHA-256 hash chaining. If any entry is modified or deleted, the chain breaks and the app shows it. This matters for grant accountability and data integrity.

---

## Features

- Voice dictation to structured case notes (ElevenLabs STT + Claude)
- Text-to-speech readback on any case note (ElevenLabs TTS)
- AI-generated client handoff summaries (Claude)
- Tamper-evident audit log with SHA-256 hash chaining
- Google SSO and email/password auth via Supabase
- Row-level security enforced at the database layer
- Zod validation on all API routes
- Accessible UI built on Radix UI primitives

---

## How the audit log works

Each log entry stores:

```
entry_hash = SHA256(previous_hash + timestamp + user_id + action + table + record_id)
```

You cannot change or delete an entry without breaking every hash that comes after it. The audit page shows a live integrity check. If the chain is intact, you get a green badge. If it's broken, the app tells you which entry ID is the problem.

No UPDATE or DELETE policies exist on the `audit_log` table. That's enforced at the database layer, not just the application layer.

---

## Stack

- Next.js 16 App Router
- Supabase (PostgreSQL + RLS + Auth)
- Tailwind CSS + Radix UI
- ElevenLabs (STT and TTS)
- Anthropic Claude Sonnet 4.6
- Vercel
- Node.js built-in `crypto` for hash chaining

Runs on free tiers. Cost is $0/month.

---

## Setup

### 1. Clone and install

```bash
git clone https://github.com/your-org/case-manager
cd case-manager
npm install
```

### 2. Create a Supabase project

1. Go to supabase.com and create a new project
2. In the SQL Editor, run `supabase/migrations/001_initial.sql`
3. Optionally run `supabase/seed.sql` for demo data with 12 clients and 35+ service entries
4. In Authentication, enable Google as a provider
5. Set your redirect URL to `https://your-domain.vercel.app/auth/callback`

### 3. Set environment variables

Create `.env.local` (do not commit this file):

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your_publishable_key
SUPABASE_SECRET_KEY=your_secret_key
ANTHROPIC_API_KEY=sk-ant-...
ELEVENLABS_API_KEY=sk_...
```

On Vercel, add these in Project Settings under Environment Variables.

### 4. Set your account as admin

Run this in the Supabase SQL Editor to get access to the audit log:

```sql
UPDATE profiles SET role = 'admin' WHERE email = 'your@email.com';
```

### 5. Run locally

```bash
npm run dev
```

---

## Demo walkthrough

1. Create a client with the intake form
2. Go to "Log Service" and click the mic button. Say something like: "Met with Maria today, she mentioned skipping meals this week and seems anxious about housing. Will follow up in 5 days about a food bank referral." The form fills itself in.
3. On any existing case note, click the speaker icon to have it read back aloud.
4. Open a client profile and click "Generate Handoff Summary" to get a structured clinical brief.
5. As an admin, open the Audit Log page to see the hash chain and the integrity badge.

---

## Security notes

- No secrets in source code. All keys stay in `.env.local`.
- No API route is publicly accessible. Every endpoint checks `supabase.auth.getUser()` and returns 401 if the user is not authenticated.
- Admin-only routes do a second role check against the `profiles` table and return 403 if the user is not an admin.
- Auth is handled by Supabase. No hand-rolled authentication.
- RLS policies mean data isolation is enforced at the database layer, not just the API layer. Even if an API route was bypassed, the DB would still reject unauthorized reads and writes.
- Audio is transcribed then discarded. It is never stored.
- Client PII is never mixed between LLM calls.
