# FACTORY_PROGRESS — Ketcode Factory V1

Recovery checkpoint. Read this first when resuming.

## Status

| Field | Value |
|---|---|
| Current milestone | **F0 — Audit: complete. State: BLOCKED (B1, B2)** |
| Branch | `factory/f0-audit` |
| Base | `main` @ `c08079c` (unchanged) |
| Latest verified commit | see `git log factory/f0-audit` |
| Production touched | No |
| Databases touched | None (Tayyar projects never queried; Ketcode project not reachable) |
| Automatic resumption | **Not configured.** Resume manually with the instruction below. |
| Linear | Not used yet: workspace only has the Tayyar team (see D11). |

## Blockers

- **B1** — Ketcode Supabase project not reachable from Claude's Supabase connection (only org "Tayyar Core" is connected). Fix: connect the Ketcode-owning Supabase org, or create a free Ketcode-only preview project and connect it.
- **B2** — Vercel `ketcode-com` uses the same `SUPABASE_URL` / `SUPABASE_SECRET_KEY` for Preview and Production. Fix: a separate preview database; Factory code will only read `FACTORY_SUPABASE_URL` / `FACTORY_SUPABASE_SECRET_KEY`, set on Preview only.

Details: `docs/factory/F0-architecture-audit.md` §8.

## Environment notes

- No package-registry access in Claude's sandbox → `npm ci` impossible locally. Verify via Vercel Preview builds (`next build` type-checks). If local installs become available, run `npm run lint && npx tsc --noEmit && npm run build`.
- Every push builds two Vercel projects (`ketcode-com`, `ketcode-sites`). Previews are SSO-protected.
- Next.js 16: read `node_modules/next/dist/docs/` before writing routes (AGENTS.md).

## Plan (ordered PRs)

Each PR: own branch, Preview build green, acceptance evidence recorded here.

### F1 — Lead capture & CRM
1. **F1.1 Schema foundation** — apply `docs/factory/schema-v1-draft.sql` as a real migration on the preview DB; advisors clean. *Accept:* tables exist, anon/authenticated cannot select any Factory table, live `leads` insert still succeeds.
2. **F1.2 Factory env guard + server data client** — `lib/factory/env.ts`, `lib/factory/db.ts`; all Factory routes 503 unless `FACTORY_ENABLED=true` + `FACTORY_SUPABASE_*`. *Accept:* Preview without vars returns 503 and no network call to Supabase.
3. **F1.3 Lead → contact + CRM fields** — extend `/api/leads` (UTM, qualification summary), contact suggestion, `events(lead.created)`, DB-backed rate limit. *Accept:* one lead per session, replay = no duplicate, event recorded.
4. **F1.4 Operator auth + /admin/leads** — magic link, operator role check, list/filter/status/next step. *Accept:* non-operator gets 404; status change writes event.
5. **F1.5 Cleanup** — remove dead `app/page.tsx` + `ChatDemo.tsx`.

### F2 — Client portal
6. **F2.1 Lead → client + project conversion** (operator action, idempotent via `projects.lead_id unique`).
7. **F2.2 Client magic-link login + /portal** — sees only own projects; isolation test A↛B.
8. **F2.3 Requirements form** — versioned `project_requirements`, file uploads to private storage bucket with signed URLs.

### F3 — Production & preview
9. **F3.1 Template package format** — `templates/<id>/v<n>/` + `schema.json`; port the 3 existing samples; registry rows.
10. **F3.2 Production job + brief export** — generates brief.json + PRD §8.3 tasking text; one active job per project.
11. **F3.3 Register result + preview deployment** — commit SHA, preview URL, QA checklist; noindex headers; portal shows link.
12. **F3.4 Approve / request changes** — bound to deployment version; history kept.

### F4 — Payment & delivery
13. **F4.1 Payment abstraction + sandbox adapter + verified webhook** (provider per D2).
14. **F4.2 SLA timer** — start rule per PRD §12.1 (D4), pause reasons, operator alerts.
15. **F4.3 Domain & email workflow** — MX capture before change, DNS instructions, send/receive test checkboxes.
16. **F4.4 Launch checklist + LIVE/DELIVERED gating** — LIVE only after HTTPS + domain verified; DELIVERED only after checklist incl. email.
17. **F4.5 End-to-end Preview test** — PRD §20 tests 1–12 with sandbox data; evidence recorded here.

## Founder decisions (open)

| # | Decision | Engineering default until decided |
|---|---|---|
| D1 | Package catalogue (site says 990 SAR yr1 / 490 SAR renewal), revision limits | No prices seeded; read from `packages` table. |
| D2 | Payment provider + receiving entity (Ket Code LLC is a Wyoming LLC; SAR collection) | Sandbox adapter only. |
| D3 | Tax/invoice policy | Out of V1 code. |
| D4 | 72h clock start: site says "from design approval + content received"; PRD says "approval + payment + launch reqs + operator start" | Implement PRD; site copy untouched. |
| D5 | Email provider + mailbox count | Workflow records only. |
| D6 | Domain/hosting/email ownership & renewal | Domain recorded with `owner_of_record`. |
| D7 | Refund/cancellation policy | — |
| D8 | Support hours after delivery | — |
| D9 | Recurring-cost owner | — |
| D10 | Assistant usage/cost cap (OpenRouter monthly budget) | Existing token/turn caps. |
| D11 | Linear: create a separate "Ketcode" team (recommended) vs a project inside the Tayyar team | No Linear writes yet. |
| D12 | Portal domain (`app.ketcode.com` proposed) | Preview URLs only. |

## Test evidence

| Date | Milestone | Evidence |
|---|---|---|
| 2026-11-08 | F0 | Repo, Vercel projects/envs/deployments, Supabase org listing, Linear teams inspected read-only. Findings in audit doc. |

## Restart instruction (paste into a new session in the Ketcode Factory project)

> Continue Ketcode Factory from `FACTORY_PROGRESS.md` on branch `factory/f0-audit` of TayyarCore/ketcode-web. Check whether blockers B1/B2 are cleared; if yes, start F1.1.
