# Ketcode Factory — F0 Architecture & Repository Audit

Date: 2026-11-08
Branch: `factory/f0-audit`
Mode: read-only discovery. No Production resource, database, or environment variable was modified.

**Verdict: BLOCKED (environment access).** The audit is complete; implementation of F1+ cannot start safely until the two blockers in §8 are cleared.

---

## 1. What exists today (verified)

### 1.1 Repository `TayyarCore/ketcode-web` (main @ `c08079c`)

| Area | State |
|---|---|
| Framework | Next.js 16.2.4, React 19.2, TypeScript, Tailwind 4, zod 4. `AGENTS.md`: Next 16 has breaking changes — read `node_modules/next/dist/docs/` before writing routes. |
| Public site | Static HTML in `public/` (home, `/websites`, `/templates/{realestate,clinic,salon}`, terms, privacy, refund) served through `next.config.ts` rewrites. |
| AI sales assistant | `public/assets/chat-widget.js` (vanilla JS, AR/EN, loaded by `site.js` on `/` and `/websites/`). Server route `app/api/chat/route.ts` → OpenRouter Chat Completions, model from `OPENROUTER_MODEL`, 220 max tokens, 10-turn cap, zod validation, scoped system prompt with anti-injection rules. |
| Lead capture | `app/api/leads/route.ts` → inserts into Supabase `public.leads` via REST with the server-only secret key. Consent required. Idempotent on `session_id` (unique, 23505 → treated as saved). |
| Notification | `lib/lead-email-notification.ts` → SMTP (nodemailer) to `SALES_NOTIFICATION_EMAIL` after the row is stored. Best-effort; failure does not drop the lead. |
| Rate limiting | `lib/rate-limit.ts` — in-memory per instance (documented as insufficient for public traffic). |
| DB migrations | One: `supabase/migrations/20261026132030_create_leads.sql` — `leads` table, RLS on, `INSERT` only to `service_role`, no browser roles. |
| Auth | None. |
| Admin / CRM UI | None. |
| Client portal | None. |
| Payments | None. |
| Tests | None (no test runner configured). Checks: `lint`, `tsc --noEmit`, `build`. |
| Unused code | `app/page.tsx` + `components/chat/ChatDemo.tsx` (React demo) are shadowed by the `/` → `/index.html` rewrite. |

### 1.2 Published commercial promises (live on ketcode.com)

- Package price: **990 SAR first year**, renewal **490 SAR/year** (hosting, email, care).
- Free demo/sample in the customer's name **before payment**.
- "Ready to launch within **72 hours of design approval and receipt of all required text and photos**."

Note: the PRD (§12.1) starts the 72h clock only after approval **and confirmed payment** and operator confirmation. The live wording does not mention payment. This is a commercial-promise question → founder decision D4. Engineering will implement the PRD definition and will not change site copy.

### 1.3 Website templates

`public/templates/*` are three single-page static showcases (~5–6 KB each) that depend on the shared `template-sites.css`. They are **not parameterised** (no content model, no build per customer). They are marketing samples, not a production template library. The Production Engine (PRD §8) needs a real template package format — see plan F3.

### 1.4 Vercel (team `tayyar`)

| Project | Domains | Source | Notes |
|---|---|---|---|
| `ketcode-com` | ketcode.com, www | ketcode-web `main` → Production | Every branch push creates a Preview. Previews are SSO-protected (`all_except_custom_domains`). |
| `ketcode-sites` | sites.ketcode.com | same repo, same `main` | Duplicate build of the same app. Purpose unclear (likely intended for template demos). |

Environment variables on `ketcode-com`:

| Key | Targets |
|---|---|
| `SUPABASE_URL`, `SUPABASE_SECRET_KEY` | **production + preview (same values)** — commented "Isolated KetCode leads project; Production" |
| `OPENROUTER_API_KEY`, `OPENROUTER_MODEL` | production only (assistant fails closed on Preview) |
| `SMTP_*`, `SALES_FROM_EMAIL`, `SALES_NOTIFICATION_EMAIL` | production + preview |

### 1.5 Supabase

The connected Supabase account exposes one organisation, **Tayyar Core**, with three projects: `Tayyar_ production`, `Tayyar_ Preview`, `tayyar-integrations-production`. **The Ketcode leads/Factory project is not visible to this session.** It lives in a different organisation/account. Its schema, data, advisors and auth settings could not be inspected. Nothing was run against any Tayyar project.

### 1.6 Linear

The workspace has one team, **Tayyar (TAY)**. There is no Ketcode team. Per the operating rules, no Tayyar issues or projects were created or modified.

### 1.7 Local build environment

This execution environment has no package-registry access, so `npm ci` cannot run here. Build/lint/typecheck verification must happen on Vercel Preview builds (which run `next build`, including type checking) until local installs are possible.

---

## 2. Reuse map

| Keep and extend | Why |
|---|---|
| Static marketing pages + rewrites | Live, SEO-tuned, already selling. Do not rebuild. |
| `/api/chat` + `chat-widget.js` | Working, scoped, injection-hardened assistant. Extend with structured qualification fields, do not replace. |
| `/api/leads` + `leads` table | Already the source of truth with consent + idempotency. Extend the table additively (new nullable columns) so the live insert keeps working. |
| SMTP notification | Already configured; reuse for operator notifications in F1. Customer-facing auth email goes through Supabase Auth. |
| Vercel Preview + SSO protection | Reuse as the Factory Preview environment and the first layer of preview protection. |

| Remove later (low priority) | |
|---|---|
| `app/page.tsx`, `ChatDemo.tsx` | Dead code behind the rewrite. Remove in F1 cleanup PR. |

---

## 3. Gaps by customer journey

| Journey step | Gap |
|---|---|
| Ad → landing | UTM/source not captured (only `source_page`). |
| Assistant → lead | No structured qualification (business type, package, summary). No CRM status/owner/next step. No Contact entity, no dedupe across sessions. |
| Lead → registration | No auth, no portal. |
| Project | No projects, requirements versions, templates registry. |
| Production | No job records, no template package format, no build/QA pipeline. |
| Preview | No per-project preview deployments or protection model. |
| Approval | No approvals bound to a preview version. |
| Payment | No provider, no webhook, no invoices. |
| Domain / email | No records, no DNS pre-check workflow. |
| Delivery | No SLA timer, no checklist, no event log. |

---

## 4. Target architecture (V1)

```text
ketcode.com (static pages)          app.ketcode.com (proposed)
   │  chat-widget.js                    ├── /admin   operator (Supabase Auth, role=operator)
   ▼                                    └── /portal  client   (Supabase Auth magic link)
/api/chat ──► OpenRouter                         │
/api/leads ─┐                                    ▼
            ├──► Supabase "Ketcode Factory" (single isolated project)
/api/factory/* (server only, secret key, explicit ownership checks)
            │        tables: contacts, leads(+), clients, client_memberships,
            │        projects, project_requirements, templates, production_jobs,
            │        deployments, approvals, payments, domains, email_services, events
            ▼
  Production Engine (V1 = supervised)
   operator downloads brief.json → Claude builds from template package
   → commits to ketcode-sites repo/folder → Vercel Preview → result registered
```

Principles:

1. **One Next.js app, one repo.** Admin and portal live in this repo under `app/(factory)`; the marketing site is untouched.
2. **Server-only data access.** All Factory tables are granted to `service_role` only (same pattern as `leads`). Every read/write goes through server routes that check the session user and project ownership. RLS stays enabled (deny-all for `anon`/`authenticated`) as defence in depth. This avoids exposing tables to the browser at all.
3. **Fail closed behind a flag.** Factory routes require `FACTORY_ENABLED=true` and dedicated `FACTORY_SUPABASE_URL` / `FACTORY_SUPABASE_SECRET_KEY`. Without them, every Factory route returns 503 and touches nothing. This prevents Preview from writing to the live leads database.
4. **Append-only events table** is the audit trail and the notification trigger source.
5. **Idempotency by constraint**, not UI: unique keys on `session_id`, `(project_id, idempotency_key)` for jobs, `provider_event_id` for payments.

---

## 5. Authentication & authorization design

- Supabase Auth, email magic link (no passwords in V1).
- `profiles(user_id, role)` with role `operator | client`. Operator accounts are created manually (one operator in V1). Self sign-up creates `client` only.
- A client sees a project only through `client_memberships(client_id, user_id)` → `projects.client_id`. Every portal query is `WHERE client_id IN (memberships of auth user)` executed server-side.
- Portal URLs use project UUIDs and still enforce ownership; a guessed UUID returns 404 (no existence leak).
- Production Worker identity: deferred to F5.

## 6. Lead capture data flow (F1)

1. Widget posts `/api/leads` (unchanged contract + optional `utm`, `qualification`).
2. Server upserts `contacts` by normalised email/phone **only as a suggestion** (`contact_id` linked; merge of two leads is an operator action — PRD §5.3).
3. Inserts `leads` row (`status='new'`), writes `events(lead.created)`.
4. Operator email notification (existing SMTP).
5. Admin `/admin/leads` lists by status with next step.

## 7. Production, preview and payment boundaries

- **Templates**: versioned packages `templates/<id>/<version>/` (HTML/CSS + `schema.json` describing editable fields). Old versions immutable.
- **Production job (V1 supervised)**: Admin generates `brief.json` + the PRD §8.3 tasking text; operator runs Claude; operator registers result (commit SHA, preview URL, QA checklist). No Claude API integration assumed.
- **Customer previews**: deployed from the `ketcode-sites` Vercel project, one path or branch per project, behind Vercel deployment protection; the portal shows the link only to the owning client. `noindex` header on all preview responses.
- **Payments**: provider not chosen (D2). F4 implements a provider-agnostic `payments` table + verified-webhook handler interface + a sandbox adapter. No real transactions.
- **Domain/email**: workflow records + DNS pre-check checklist (existing MX captured before any change). No automated DNS edits in V1.

## 8. Blockers (need founder action)

| # | Blocker | Why it blocks | Recommended fix | Safest alternative |
|---|---|---|---|---|
| B1 | Ketcode Supabase project is not reachable from this session (different org/account). | Cannot inspect the real schema, apply migrations, configure Auth, or test anything that touches data. | Connect the Supabase org that owns the Ketcode project to Claude (Settings → Connectors → Supabase) so it appears beside Tayyar Core. | Create a new free Supabase project "ketcode-factory-preview" in a Ketcode-only org (free tier, no cost) and connect it. |
| B2 | Preview and Production share the same `SUPABASE_URL`/`SUPABASE_SECRET_KEY`. | Any Preview test of lead capture writes into the live leads table; Factory testing would mix test and real customers. | A separate **preview** database (branch or separate free project) whose keys are set only on the Preview target. Factory code will read only `FACTORY_SUPABASE_*`. | Keep shared keys but never enable `FACTORY_ENABLED` on Preview until B2 is fixed (Factory stays untestable). |

Non-blocking but needed later: D1–D10 in `FACTORY_PROGRESS.md`.

## 9. Security & cost risks found

| Risk | Severity | Action |
|---|---|---|
| Preview writes to production leads DB (B2) | High | Separate DB before F1 testing. |
| In-memory rate limit only | Medium | F1: DB-backed limiter (Postgres function) — no new paid service. |
| Two Vercel projects build the same repo on every push | Low (build minutes) | Decide purpose of `ketcode-sites`; reuse it for customer previews in F3. |
| Static templates are not real production templates | Medium (delivery speed) | F3 template package format. |
| 72h wording on site differs from PRD | Commercial | Founder decision D4. |
| No automated tests | Medium | Add `vitest` for pure logic (state machines, SLA, idempotency) once installs are possible. |

## 10. Implementation plan (small PRs)

See `FACTORY_PROGRESS.md` §Plan for the ordered PR list with acceptance criteria.
