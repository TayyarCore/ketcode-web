# Ket Code AI Sales Assistant — V1

Status: Integrated into the current KetCode website shell for Preview review

## Goal
Convert ketcode.com visitors into qualified leads for website design and development services through a bilingual Arabic/English conversational assistant.

## Scope
- Lazy-loaded chat widget, accessible on mobile and desktop, Arabic RTL / English LTR.
- Conversation asks one question at a time; detects service, business type, project requirements, budget range, timeline.
- Only request name and preferred contact method when the visitor wants a follow-up; explicit consent before saving personal data.
- Answers grounded in approved Ket Code service descriptions. Never fabricate portfolio work, guarantees, delivery dates or fixed quotes.
- Human handoff when uncertain, visitor requests a person, or a pricing commitment is needed.
- Lead record includes conversation summary, consent timestamp, source page, language, and qualification fields.
- Email notification to sales after a qualified lead is stored. No WhatsApp dependency for V1.

## Architecture
Serve the current static KetCode pages from `public/` through Next.js rewrites and keep the server-only `app/api/chat/route.ts` and `app/api/leads/route.ts` endpoints. The shared site script loads the widget only on the homepage and website-service page. Keep provider and Supabase keys in server environment variables only. Store lead data in a KetCode-specific datastore; never use Tayyar production tables.

### Confirmed V1 decisions
- AI provider: OpenRouter Chat Completions API, with the model selected through the server-only `OPENROUTER_MODEL` variable.
- Approved service catalog: website design and development only.
- Lead storage: the isolated Supabase project `ketcode-leads`, never a Tayyar database.
- Temporary sales recipient: `info@ketcode.com`, configured through `SALES_NOTIFICATION_EMAIL` so it can be replaced with a new alias.

### Current implementation boundary
- Chat and lead endpoints, bilingual UI, explicit consent, input/output limits, moderation, and fail-closed behavior are implemented.
- Supabase persistence is implemented with a server-only secret key and a least-privilege `leads` table migration.
- Email delivery is implemented through configurable SMTP after the lead is stored. Supabase remains the source of truth, and an email failure does not discard the lead.
- The in-memory rate limit is a lightweight first barrier. A shared server-side limiter is still required before public launch because serverless instances do not share memory.

## Security and cost
- Rate limit per IP/session, message-length and turn caps, per-request token ceilings, strict input validation, abuse detection.
- Fixed model allowlist, monthly budget and alert, fail closed on unavailable AI service.
- Avoid collecting sensitive data; disclose AI assistance and provide privacy notice.
- Protect lead submission against spam; restrict database writes to server credentials; retention/deletion policy before launch.
- Never expose secrets or raw prompts in client bundles.

## Acceptance criteria
1. Arabic and English conversations work on mobile and desktop.
2. Visitor can obtain service information and request human follow-up.
3. Lead is persisted only after explicit consent; notification sent.
4. Bot cannot promise unapproved prices or services.
5. Abuse and token ceilings tested.
6. Existing site remains functional; build, lint and preview smoke tests pass.
7. No production deployment or main branch merge without review.

## Decisions still needed before launch
- Confirm the correct Vercel project/repository linkage before creating a Preview deployment.
- Add the OpenAI project key, exact model, monthly budget, and billing alert.
- Apply the `leads` migration to the isolated `ketcode-leads` project and add its server-only URL and secret key to Preview.
- Select an email sending mechanism for notifications to `info@ketcode.com`.
- Approve the privacy notice and lead/conversation retention period.
- Replace the in-memory limiter with a shared server-side limiter for public traffic.
