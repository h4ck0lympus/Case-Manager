# ![][image1]

*This is an open doc\! Please leave a comment if you have questions\!*

# **Nonprofit Client & Case Management Platform**

Slack: [\#npo-client-case-management-platform](https://opportunity-hack.slack.com/archives/C0APEMY77GS)

Last Updated: Mar 23, 2026

OHack Nonprofits: NMTSA, Chandler CARE Center, Will2Walk, ICM Food & Clothing Bank, Sunshine Acres, Lost Our Home Pet Rescue, Tranquility Trail, Seed Spot

# **1\. High-Level Summary**

**The Problem:** Nonprofits delivering human services (therapy, food assistance, housing, animal rescue, youth mentoring) need to track clients, record services, schedule visits, and report outcomes to funders. Today, 92% of nonprofits operate on budgets under $1M and rely on spreadsheets, paper forms, and disconnected Google Forms. Enterprise solutions like Bonterra Apricot cost $50–150+/user/month, putting them out of reach.

**The Solution:** Build a lightweight, open-source client and case management web application that any nonprofit can deploy for under $30/month. The system handles client registration, demographics, visit scheduling, treatment/service logging, role-based access, and basic reporting. It is the generalized version of problems submitted by 9+ OHack nonprofits across 7 hackathons (2016–2024).

**Target Users:** Nonprofit staff (case managers, therapists, coordinators, volunteers) with limited technical expertise. They need something as easy as Google Sheets but with structured data, access controls, and exportable reports.

## **OHack Nonprofits This Serves**

| Nonprofit | Their Problem | Hackathon History |
| :---- | :---- | :---- |
| **NMTSA** | Schedule music therapy sessions, track client treatment progress, log therapist notes | 2017, 2019, 2020 Summer |
| **Chandler CARE Center** | Client intake for crisis services, demographics tracking, visit history for families in need | 2019 (2nd Place winner) |
| **Will2Walk** | Track rehabilitation progress for spinal cord injury patients over time | 2018 |
| **ICM Food & Clothing Bank** | Track client visits, services provided, family demographics for grant reporting | 2018 |
| **Sunshine Acres** | Track children in care, health records, placement history | 2017 |
| **Lost Our Home Pet Rescue** | Manage animal intake, foster tracking, adopter records, volunteer coordination | 2018 |
| **Tranquility Trail** | Animal sanctuary intake, medical records, donor/volunteer management | 2018 |
| **Seed Spot** | Track alumni entrepreneurs, communications, program engagement metrics | 2015 |

**Key Insight:** Every one of these nonprofits submitted what is fundamentally the same problem: "We need to register clients, record what we do for them, and report on it." The only differences are the domain-specific vocabulary (patients vs. animals vs. alumni vs. families). A configurable system with customizable fields solves all of them.

# **2\. Recommended Technology**

The tech stack is optimized for: hackathon speed, university student familiarity, low hosting cost (\<$30/mo), and one-click deployment. All choices below are mainstream enough that any CS student will have exposure.

| Layer | Suggested (but not required) Technology | Why |
| :---- | :---- | :---- |
| **Frontend** | Next.js 14+ (React) | Most-taught React framework. App Router \+ Server Components reduce boilerplate. Built-in API routes eliminate separate backend for simple cases. |
| **UI Library** | shadcn/ui \+ Tailwind CSS | Copy-paste components, no vendor lock-in, accessible by default. Students can move fast without design skills. |
| **Backend/API** | Next.js API Routes or FastAPI (Python) | Two paths: JS-only team uses Next.js API routes; Python-familiar team uses FastAPI. Both support rapid prototyping. |
| **Database** | Supabase (PostgreSQL) | Free tier covers MVP. Built-in auth, row-level security, real-time subscriptions, REST API auto-generated. Replaces Firebase with SQL familiarity. |
| **Auth** | Supabase Auth (Google SSO \+ email) | Zero-config Google SSO. Role-based access via Supabase RLS policies. Meets the original OHack requirement for Google Single Sign-on. |
| **Hosting** | Vercel (free tier) | One-click deploy from GitHub. Free for hobby projects. Automatic HTTPS, preview deploys for PRs. |
| **File Storage** | Supabase Storage | Document uploads (intake forms, photos) stored alongside data. S3-compatible. |
| **CSV Import/Export** | Papa Parse (JS) | Lightweight CSV parsing. Critical for nonprofits migrating from spreadsheets. |

## **Cost Estimate**

| Service | Free Tier Limit | Paid Tier (if needed) |
| :---- | :---- | :---- |
| Supabase | 500MB DB, 1GB storage, 50K auth users | $25/mo (Pro) |
| Vercel | 100GB bandwidth, serverless functions | $20/mo (Pro) |
| Domain | \*.vercel.app free | $12/year custom domain |
| **Total (MVP)** | **$0/month** | **$25–46/month at scale** |

## **Alternative Stack (if team prefers Python)**

* **Backend:** FastAPI \+ SQLAlchemy \+ Alembic migrations

* **Frontend:** React (Vite) or Django templates for maximum simplicity

* **Deploy:** Railway.app ($5/mo) or Render (free tier) — both support one-click from GitHub

* **Database:** Still Supabase (use the Python client library), or Neon PostgreSQL free tier

# **3\. What to Solve in a 24-Hour Hackathon**

Requirements are prioritized P0 (must ship), P1 (demo-worthy), P2 (nice-to-have). A strong team should complete all P0s and 2–3 P1s. P2s are stretch goals or post-hackathon work.

## **P0 — Must Have (Ship or Fail)**

*These are the minimum features to demonstrate a working product to judges and the nonprofit.*

| Pri | Feature | Acceptance Criteria |
| ----- | :---- | :---- |
| **P0** | **Auth \+ Role-Based Access** | Users can sign up/login via Google SSO or email. Two roles exist: Admin (full CRUD) and Staff (read \+ create records).  Unauthorized users cannot access the app. |
| **P0** | **Client Registration** | Staff can create a new client with: name, date of birth, contact info (phone/email), and 3–5 configurable demographic fields (e.g., gender, language, household size).  Client gets a unique ID. List view shows all clients with search by name. |
| **P0** | **Service/Visit Logging** | Staff can log a service entry against a client: date, service type (dropdown, configurable), staff member, and free-text notes. A client's profile shows chronological history of all services received. |
| **P0** | **Client Profile View** | Single-page view showing client demographics at top, visit/service history below in reverse chronological order. Think of it as a simple EHR "chart" view. |
| **P0** | **Deploy \+ Seed Data** | App is deployed to a public URL (Vercel/Render). Demo data is seeded (10+ clients, 30+ service entries) so judges can evaluate immediately. README includes one-click deploy instructions. |

## **P1 — Good to Have (Winning Teams Build These)**

*These differentiate a good solution from a great one. Pick 2–3 based on team strengths.*

| Pri | Feature | Acceptance Criteria |
| ----- | :---- | :---- |
| **P1** | **CSV Import/Export** | Admin can upload a CSV of existing clients (name, DOB, contact, demographics) and the system creates records. Admin can export all clients or all service logs to CSV. This is critical for nonprofits migrating from Excel. |
| **P1** | **Basic Reporting Dashboard** | A dashboard page showing: total active clients, services delivered this week/month/quarter, breakdown of service types (bar chart), and trend line of visits over time. Exportable to PDF or printable. |
| **P1** | **Scheduling / Calendar** | Staff can schedule future appointments for clients. Calendar view shows upcoming appointments for today/this week. Email or in-app reminder for upcoming appointments. |
| **P1** | **Configurable Fields** | Admin can add/remove custom fields on the client profile and service log without code changes. E.g., NMTSA adds "instrument played"; a food bank adds "household size" and "dietary restrictions." Stored as JSON schema. |
| **P1** | **Audit Log** | All create/update/delete actions are logged with timestamp, user, and before/after values. Admin can view the audit log. Required for HIPAA-adjacent compliance and grant accountability. Note that client/patient data should not be logged since this is sensitive Personally Identifiable Information (PII). |

## **P2 — Nice to Have (Post-Hackathon / Stretch Goals)**

*These move the product toward commercial viability. Ideal for continued development after the hackathon.*

| Pri | Feature | Acceptance Criteria |
| ----- | :---- | :---- |
| **P2** | **Multi-Tenant Support** | Single deployment serves multiple nonprofits with data isolation. Each org has its own subdomain or org-id. This is the key to scaling as a SaaS product. |
| **P2** | **Document Uploads** | Staff can attach files (intake forms, signed waivers, photos) to a client profile. Files stored in Supabase Storage with access controls matching client visibility. |
| **P2** | **Funder Report Templates** | Pre-built report templates that auto-populate with data: "Clients served this quarter," "Demographics breakdown," "Services by type." Exportable to Word/PDF for grant applications. |
| **P2** | **Mobile-Responsive / PWA** | App works fully on mobile browsers. Optionally installable as a PWA. Staff at food banks and field workers often use phones, not desktops. |
| **P2** | **Integration: DonorPerfect / Salesforce / Zapier** | API-based sync of client or donor data with DonorPerfect or Salesforce NPSP. Webhook support for real-time updates. Integrating with something like Zapier would also allow nonprofits to make their own No-Code integrations with other services that also utilize Zapier, making the solution that much more appealing as the \# of integrations increase 100x. |
| **P2** | **AI-Powered Intake** | Upload a photo of a paper intake form; AI extracts fields and pre-populates a new client record. Leverages OHack's existing YOLOv3 form-detection work from ASU capstones. |

# 

# **4\. Hackathon Team Guidance**

## **Suggested Team Roles (4–5 people)**

| Role | Owns | First 2 Hours |
| :---- | :---- | :---- |
| **Full-Stack Lead** | Auth, deploy, DB schema, API routes | Set up Supabase project, Vercel deploy, auth flow working end-to-end |
| **Frontend Dev** | Client list, client profile, service log form | Scaffold Next.js app, install shadcn/ui, build client list page |
| **Backend Dev** | API routes, CSV import/export, data validation | Define Supabase tables \+ RLS policies, seed demo data |
| **Design / UX** | Wireframes, user flow, demo narrative, reporting dashboard | Paper prototype the 3 core screens, user-test with a mentor |
| **PM / Demo Lead** | Prioritization, README, demo video, pitch | Write README, set up GitHub project board, draft demo script Develop what the demo will look like |

## **24-Hour Timeline**

| Time | Milestone |
| :---- | :---- |
| **Hours 0–2** | Supabase \+ Vercel set up. Auth working. DB schema created. Seed script written. Wireframes done. |
| **Hours 2–6** | Client CRUD (create, list, search, view profile). Service log form. Everything deployed and live. |
| **Hours 6–12** | Polish P0 features. Start P1s: CSV import, dashboard charts, or scheduling. Role-based access tested. |
| **Hours 12–18** | Complete 2–3 P1 features. Bug fixes. Mobile responsiveness pass. Seed realistic demo data. |
| **Hours 18–22** | Feature freeze. README finalized. Demo video recorded. Edge cases tested. |
| **Hours 22–24** | Practice demo. Final deploy. Submit to DevPost. Sleep deprivation sets in. |

# **5\. References & Prior Art**

* **OHack 2020 Summer Internship (EHR \+ CRM projects):** github.com/opportunity-hack/2020-summer-volunteer-internship

* **Chandler CARE Center 2019 (2nd Place):** devpost.com/software/chandler-care-center-data-intake

* **NMTSA 2019 Schedule App:** devpost.com/software/nmtsa-scheduleapp

* **NMTSA 2017 Project:** devpost.com/software/team-3-nmtsa

* **OHack Project Listing:** ohack.dev/projects

* **Competitive Landscape:** Bonterra Apricot ($50–150+/user/mo), CharityTracker ($20/user/mo), Sumac, CiviCRM (free but complex)

* **Market Context:** Nonprofit case management software is a $400–550M market. 92% of nonprofits have budgets under $1M. Bonterra consolidation has raised prices and created a vacuum for affordable tools.

# **6\. Why AI Changes Everything for This Product**

The original SRD (Sections 1–6) describes a solid CRUD application. That alone is valuable — it replaces spreadsheets. But in 2026, CRUD is table stakes. **The defensible moat for OHack’s case management product is AI that understands the nonprofit context.** Bonterra, Salesforce, and CharityTracker will bolt on generic AI features. OHack can build AI that is purpose-built for small nonprofits from day one, because we understand their workflows from 9+ years of hackathons.

## **The Pain → AI Solution Map**

*Every AI feature below maps directly to a documented case manager pain point. No AI for the sake of AI.*

| Time Sink | Current Reality | AI Solution | Time Saved |
| :---- | :---- | :---- | :---- |
| **Case Notes** | Type notes after every client interaction. Often delayed to end-of-day, losing detail. | Voice-to-Structured-Notes: speak into phone, get formatted case notes | \~45 min/day per case manager |
| **Intake** | Paper forms → manual data entry. Or re-type from PDF. 15–20 min per client. | Photo-to-Intake: snap a photo of paper form, AI extracts all fields | \~12 min per new client |
| **Funder Reports** | Export data, massage in Excel, write narrative. 2–5 days per quarter per funder. | Auto-Generated Grant Reports: raw data → narrative report matching funder template | \~3 days per quarter |
| **Client Handoffs** | Staff turnover is 30%+/year. New staff inherits case files with no context. | AI Case Summary: generate a structured handoff brief from all notes \+ history | \~2 hours per client transfer |
| **Finding Info** | Ctrl+F through hundreds of notes. "Did we already refer this client to housing?" | Semantic Search: ask natural language questions across all case notes | \~20 min/day per case manager |
| **Follow-ups** | Sticky notes, mental checklists. Clients fall through cracks when caseloads spike. | Smart Nudges: AI reads notes, detects implied follow-ups, creates reminders | Prevents missed care events |
| **Language** | Spanish-speaking clients need translated forms. Staff Googles phrases. | Real-time multilingual intake \+ communication via LLM translation | Removes language as a barrier |

# **7\. AI-Forward P2 Requirements**

These replace and expand the P2 section from the original SRD. Each feature is scoped for a hackathon MVP with a path to production. They are ordered by impact-to-effort ratio: Feature 1 is the highest-leverage thing a team can build.

## **P2-AI-1: Voice-to-Structured Case Notes**

**The pitch:** A case manager finishes a 30-minute session with a client. Instead of typing for 20 minutes, they tap a button, speak for 2 minutes, and the system generates a structured case note with service type, key observations, follow-up actions, and mood/risk assessment — all editable before saving.

| Aspect | Detail |
| :---- | :---- |
| **How it works** | Browser MediaRecorder API captures audio → Whisper API (or Deepgram) transcribes → Claude/GPT-4o structures the transcript into: (1) Summary, (2) Service type detected, (3) Action items extracted, (4) Mood/risk flags, (5) Suggested follow-up date. Case manager reviews, edits, and saves. |
| **Tech stack** | OpenAI Whisper API ($0.006/min) or Deepgram ($0.0043/min) for STT. Anthropic Claude API or OpenAI GPT-4o-mini ($0.15/1M input tokens) for structuring. Total cost: \~$0.01–0.03 per case note. |
| **Hackathon MVP** | Record button on service entry form. Audio sent to Whisper. Transcript sent to LLM with a system prompt containing the org’s service types and note template. JSON response populates form fields. Staff clicks “Save” or edits first. |
| **Privacy consideration** | Audio is ephemeral — never stored, only the transcript and structured output. The system prompt must never include other clients’ data. Add a consent toggle for recording. |
| **OHack nonprofit fit** | NMTSA therapists, Chandler CARE Center crisis counselors, Will2Walk rehab coordinators — all do session-based work where post-session documentation is the bottleneck. |

## **P2-AI-2: Photo-to-Intake (AI Form Digitization)**

**The pitch:** A food bank volunteer photographs a paper intake form with their phone. The system reads every field — name, address, household size, dietary needs — and creates a new client record. No typing. This extends OHack’s 2018–2020 YOLOv3 capstone work, but now a single vision API call replaces a custom ML pipeline.

| Aspect | Detail |
| :---- | :---- |
| **How it works** | User uploads photo or uses device camera → Image sent to Claude Vision or GPT-4o with a prompt: "Extract all form fields from this image. Return JSON matching our client schema." → JSON populates a pre-filled registration form → Staff reviews and submits. |
| **Tech stack** | Anthropic Claude 3.5 Sonnet Vision or GPT-4o Vision. Cost: \~$0.01–0.05 per image. No custom ML model needed — the YOLOv3 approach from ASU capstones is now obsolete for this use case. |
| **Hackathon MVP** | Camera button on client registration page. Single API call. Pre-fill form. Staff confirms. Ship with 3 sample paper forms (NMTSA intake, food bank registration, animal adoption application) as demos. |
| **Why this matters now** | 64% of nonprofits lack in-house tech expertise. Paper forms persist not because orgs prefer them, but because digitization was too expensive. A $0.03 API call eliminates that barrier entirely. |
| **OHack prior art** | 2018–2020 ASU capstones (YOLOv3 form detection), Mi Benefial Legal, National Kidney Foundation, Animals and Humans in Disaster Inc., Survey Stack (2018 hackathon). This feature is the culmination of 6+ years of OHack investment in this problem. |

## **P2-AI-3: Auto-Generated Funder Reports**

**The pitch:** Quarter-end arrives. Instead of 3–5 days of exporting CSVs, pivoting in Excel, and writing narrative paragraphs, the admin clicks "Generate Q1 Report" and gets a draft narrative report with data tables, demographic breakdowns, outcome summaries, and a compelling story — formatted to match their funder’s template.

| Aspect | Detail |
| :---- | :---- |
| **How it works** | System queries service\_entries \+ clients for the reporting period → Aggregates: clients served, services by type, demographics, outcomes → Sends structured data \+ a funder report template (stored as a prompt template) to LLM → LLM generates narrative sections: Executive Summary, Population Served, Services Delivered, Outcomes, Challenges → Output rendered as editable document or exported to Word/PDF. |
| **Tech stack** | SQL aggregation queries (Supabase) \+ Claude API with long context window for data \+ template. docx generation via docx-js for Word export. Cost: \~$0.05–0.15 per report. |
| **Hackathon MVP** | "Generate Report" button on admin dashboard. Hardcode one funder template (e.g., United Way or generic foundation). Generate a 2-page narrative report from seed data. Show before/after: the raw data vs. the polished output. |
| **Revenue signal** | This is the single most monetizable AI feature. Nonprofits spend thousands of staff-hours per year on grant reporting. A tool that cuts this by 80% has clear willingness-to-pay. Price it at $25/report or bundle into a $99/month tier. |

## **P2-AI-4: Semantic Search Across Case Notes**

**The pitch:** A case manager types: "Which clients have we referred to housing services in the last 6 months?" The system searches not just keywords but meaning across all case notes and returns relevant clients with highlighted context — even if the notes said "connected to Habitat" or "applied for Section 8" instead of "housing referral."

| Aspect | Detail |
| :---- | :---- |
| **How it works** | Every case note is embedded (text → vector) on save using OpenAI text-embedding-3-small ($0.02/1M tokens) and stored in Supabase pgvector. Search queries are embedded and matched via cosine similarity. Results show the client, the matching note snippet, and relevance score. |
| **Tech stack** | Supabase with pgvector extension (free tier supports this). OpenAI embeddings API. A match\_documents Supabase RPC function. Total cost: near zero for small-to-mid nonprofits. |
| **Hackathon MVP** | Search bar on the main dashboard. Embed all seed data case notes on startup. Demo 3–5 natural language queries that show results keyword search would miss. |
| **Why this wins** | No existing affordable case management tool has semantic search. CharityTracker, Apricot, FAMCare — all use keyword/filter search. This is a genuine differentiator that students can build in under 4 hours. |

## **P2-AI-5: AI-Generated Client Handoff Summary**

**The pitch:** A case manager leaves the organization. Their replacement inherits 40 active cases. Instead of reading through hundreds of individual notes per client, they click "Generate Handoff Summary" and get a structured brief: presenting issues, services provided to date, current status, active referrals, risk factors, and recommended next steps.

| Aspect | Detail |
| :---- | :---- |
| **How it works** | Retrieves all case notes \+ service entries for a client → Sends to LLM with structured prompt: "Generate a clinical handoff summary organized by: Background, Services History, Current Status, Active Needs, Risk Factors, Recommended Next Steps" → Output displayed on client profile with a "Regenerate" button. |
| **Tech stack** | Claude 3.5 Sonnet (200K context window handles even the most extensive client histories) or GPT-4o-mini for cost optimization. Cost: $0.02–0.10 per summary depending on history length. |
| **Hackathon MVP** | "Summarize" button on client profile. Seed one client with 20+ case notes spanning 6 months. Demo the before (scrolling through pages of notes) vs. after (one-page structured summary). |
| **Human impact** | Nonprofit staff turnover exceeds 30% annually. Every departure means lost institutional knowledge about clients. This feature directly prevents clients from falling through the cracks during transitions. |

## **P2-AI-6: Smart Follow-Up Detection ("AI Nudges")**

**The pitch:** A case manager writes: "Client mentioned she’s been skipping meals. Will check in next week about food assistance options." The AI detects this as an implied follow-up, creates a reminder for 7 days out, and tags it as food-security-related. No manual reminder creation needed.

| Aspect | Detail |
| :---- | :---- |
| **How it works** | On every case note save, a background LLM call extracts: (1) Any promised follow-up actions, (2) Suggested follow-up date (explicit or inferred), (3) Risk/urgency level, (4) Category tags. These are written to a follow\_ups table and surfaced on the dashboard as a to-do list with context. |
| **Tech stack** | Async Supabase Edge Function triggered on INSERT to service\_entries. Calls GPT-4o-mini (cheapest, fast enough). Writes to follow\_ups table. Dashboard polls or uses Supabase real-time subscription. |
| **Hackathon MVP** | After saving a case note, show a toast: "AI detected 2 follow-ups" with a preview. Dashboard shows all pending follow-ups across all clients, sorted by urgency. Demo with 5 case notes containing implicit and explicit follow-ups. |
| **Why this is critical** | When caseloads spike, follow-ups are the first thing to slip. A food bank client who needed a referral to WIC, a therapy client who mentioned suicidal ideation in passing — these cannot be missed. The AI acts as a safety net. |

## **P2-AI-7: Multilingual Client Communication**

**The pitch:** A Spanish-speaking family arrives at ICM Food Bank. The intake form is in English. The volunteer taps "Español" and the entire intake flow — questions, field labels, help text — renders in Spanish. The family’s responses are stored in both languages. Case notes written in English are viewable in Spanish for bilingual staff reviewing them later.

| Aspect | Detail |
| :---- | :---- |
| **How it works** | Dynamic UI translation: all form labels/help text sent to LLM for translation (cached after first translation). Client responses stored as-entered with language tag. Case notes have a "Translate" toggle that renders an LLM translation inline. |
| **Tech stack** | LLM translation via Claude or GPT-4o-mini. Cache translations in a translations table (key: original\_text \+ language → translated\_text) to avoid repeated API calls. Cost approaches zero after initial translation cache is warm. |
| **Hackathon MVP** | Language toggle on intake form (English/Spanish). Translate 1 form. Show the bilingual data storage. Stretch: voice intake in Spanish using Whisper (which supports 99 languages natively). |

# **8\. AI Architecture: How It All Connects**

All AI features share a common pattern: user action → API call → LLM/embedding → structured output → saved to database. The key architectural decisions are:

* **API Gateway Pattern:** All LLM calls go through a single server-side route (/api/ai/\[action\]) that handles auth, rate limiting, cost tracking, and prompt management. Never call AI APIs from the client.

* **Prompt Registry:** Store system prompts in a prompts table with version history. This lets nonprofits customize AI behavior (e.g., NMTSA can add music therapy terminology) without code changes.

* **Cost Controls:** Set per-org monthly AI budget caps. Track token usage per call. Default to cheapest model (GPT-4o-mini) with opt-in to more capable models. Show admins their AI spend.

* **Human-in-the-Loop:** Every AI output is a draft. The case manager always reviews and edits before saving. No AI output is ever saved without human confirmation. This is non-negotiable for trust and accuracy.

* **Privacy by Design:** Client PII is sent to the LLM only for the specific operation (e.g., structuring one note). Context windows are never loaded with other clients’ data. Audit log tracks every AI call with input/output hashes.

## **AI Cost Per Feature (Estimated)**

| Feature | API Used | Cost Per Use | Monthly Est. (50 clients) |
| :---- | :---- | :---- | :---- |
| Voice-to-Case-Notes | Whisper \+ Claude | $0.01–0.03 | $5–15 |
| Photo-to-Intake | Claude Vision | $0.01–0.05 | $0.50–2.50 |
| Funder Reports | Claude (long context) | $0.05–0.15 | $0.20–0.60 |
| Semantic Search | OpenAI Embeddings | $0.001 per query | $0.10–0.50 |
| Client Summary | Claude/GPT-4o | $0.02–0.10 | $1–5 |
| Smart Follow-Ups | GPT-4o-mini | $0.001–0.005 | $2–10 |
| Multilingual | Claude/GPT-4o-mini | \~$0 (cached) | $0.50–2 |
| **TOTAL** |  |  | **$9–36/month** |

**Key insight:** The total AI cost for a 50-client nonprofit is $9–36/month. This is less than one hour of a case manager’s time. The ROI is not even close — AI features pay for themselves many times over. This means OHack can offer AI features in a $49–99/month plan and still maintain healthy margins while being 5–10x cheaper than Bonterra or Salesforce.

# **9\. Hackathon Team: Pick Your AI Feature**

No team should attempt all 7 features. Pick 1–2 based on your team’s strengths. Here’s a decision matrix:

| Feature | Difficulty | Demo Wow | Revenue | Best If Team Has | Hours to MVP |
| :---- | :---- | :---- | :---- | :---- | :---- |
| **Voice-to-Notes** | Medium | Very High | High | Audio API experience | 4–6 |
| **Photo-to-Intake** | Easy | Very High | Medium | Vision API basics | 2–4 |
| **Funder Reports** | Medium | High | Very High | Doc generation | 4–8 |
| **Semantic Search** | Easy | High | Medium | SQL \+ embeddings | 2–4 |
| **Client Summary** | Easy | High | Medium | Prompt engineering | 2–3 |
| **Smart Follow-Ups** | Medium | Medium | High | Async processing | 3–5 |
| **Multilingual** | Easy | Medium | Medium | i18n awareness | 3–5 |

**Recommended combo for maximum impact:** Complete all P0s from the original SRD (hours 0–12), then build **Photo-to-Intake \+ Semantic Search** (hours 12–18). These two are the easiest to implement (2–4 hours each), produce visually impressive demos, and together demonstrate that this isn’t just another CRUD app — it’s an AI-native platform. If time remains, add **Client Summary** as it’s a 2–3 hour addition that completes the AI story for judges.

This SRD is maintained by Opportunity Hack Inc., a 501(c)(3) nonprofit. Questions? Join slack.ohack.dev or visit ohack.dev.

[image1]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAnAAAABfCAYAAABodvppAAAXG0lEQVR4Xu3de5RkR10H8Jme2SRrQqJoApJEnduTAEahq2cfbgK6xyObRPHNyuME/hAB584mJrjxSI6YAdFb3bO7gTUYE5SERARilIeBgxHZiAERjRyIPAxifCUKMTwCmHfWrt50b9W37qOq+3bfR38/5/zOSW796ndv3a6eru3HvXNzREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREQ0C0TnorlW9FgvDseGkO/BLkREREQ0bbhI8wkiIiIimiJcjI0TREREE9WOLpkT0afmhHy4F7fMteWrMMWbiH63V+v2IzWjW3s1z8WUmSHks/vnF1/gqxQi+gQOq3ZwzEfjv+a27j8d04eEfFtMnyPRjl6J6UREpbewFL6gEYRXraxcvQnbdPNLq4cHsbC89lJsp5yJgydbLzRpcfjwPJawtOUFVr+kEPL/sHst7Ty0aI29DlE36h8ZOEYhP4tpTuKeB6o+EVFVzC+FH9cXZtiu0/OycmlMLXml9QLjFPKrWGpIyK/Z+S7RO5Y6s8ZbkxDRPTjUysKxqcgD1syrLhHRpPksynxyi3ZCc+8pm5cvPA23V0LiL+nku+dWuu059U7pSndXb0H2aTsnUu8k3IslrZxhbnTVXDta6ddsyZf04j4r50g8hiVrQXReaoyzLX8BUyqlJd9ljKcO2t3nWvMxT63oDqO2iB7AFCIqq3b3PNw0K3wWZT65RZpfCt8zPM5g9V+wvdTwhUrF1ijANAv20d+Js9qi7Mdupdu0+gj5W5hWefq7kqKzBZsryedxrgKch5Mgousmvg8iylFLfmkqfxxKzGdR5pNbpKocp0V9AV2fizuv+HZMSdXat9Wazxi+hPygWUP+HaZU2jjnpqzqNCZ9LCL6AjbnStWv07kzbNt/pvlEtqKeb7FTfdlzuGZP2mw+ix2f3CJV5TgN/Y8w9bkor8UUJ9s7p1lzehA7DpyK6U7w3Qn1pf+6qONzvy5jEtEjUx+Lvj+1/8rbfvBEY1BZIaKPYQmiUsK5q2LG+Cx2fHKLVJXjNBh/Q8f8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>