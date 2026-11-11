# FACTORY_PROGRESS — Ketcode Factory V1

Recovery checkpoint. Read this first when resuming. Last updated: 2026-11-12 (Riyadh).

## Where things stand

| Item | State |
|---|---|
| Live site (`main`) | `c08079c`, unchanged. Old identity, WhatsApp ordering, sales assistant on `/` and `/websites`. |
| Portal + payment work | PR #3 → #4 → #5 chain, head `feat/factory-supabase-auth` @ `74403de`. Draft, not merged. |
| Redesign + portal UI | Branch `design/ketcode-identity-v2` (on top of #5), head `d3265ec`. Preview: `ketcode-com-git-design-ketcode-identity-v2-tayyar.vercel.app`. All builds green. |
| Supabase | Project **Ketcode Factory** `iuyuexdxuomvkkleubya` (reachable via Composio). Tables `leads`, `white_friday_projects`; 7 WF migrations applied directly (SQL kept in `docs/factory/*.sql`, not `supabase/migrations`). RLS on, no anon/authenticated grants. |
| Portal | Works on Preview (3 confirmed users, one project reached `launched` with a test payment). **Disabled in Production** (FACTORY_* vars are scoped to `feat/factory-supabase-auth` Preview only). |
| Payments | Stripe Sandbox only. Portal shows a pay button only on Preview with a `buy.stripe.com/test_` link. No live payment path in code. No webhook. Verify key points to a different Stripe account than the connected "Ketcode-Test" (founder is rotating keys). |
| Production deploy | Not authorised yet. |

## Done on `design/ketcode-identity-v2` (2026-11-12)

- New Ketcode identity: ink #171A33, signal #3A4BE0, lamp #F2B544; Noto Kufi Arabic (headings) + IBM Plex Sans Arabic (text); new mark `kc-mark.svg`; `public/assets/kc.css` + `kc-hero.js`.
- Homepage rebuilt (AR/EN, dark mode, JSON-LD kept). Headline: "شاهد موقع نشاطك قبل أن تدفع."
- `/websites`, `/terms`, `/privacy`, `/refund` moved to the new identity; copy and commercial terms unchanged.
- `/offers/real-estate` (799 SAR, no VAT wording): restyled; templates named "منشآت التسويق العقاري" / "منشآت المطورين العقاريين"; "لماذا Ketcode؟" trust section; FAQ for price, CRM (paid add-on), other services (not offered, ask the assistant); all CTAs → `/portal`; sales assistant loaded on the page.
- Office template published statically at `/templates/office` (offer link no longer hits Vercel SSO).
- Portal UI reorganised around "المطلوب الآن" (header + 5-step tracker → current action → project data); login, list, registration (grouped fields), staff board restyled. Logic untouched. **Not visually verified** (Chrome disconnected) — check `/portal?demo=1` first.
- Sales assistant instructions now state the published offers and point ready real-estate visitors to `/portal`.

## Founder decisions recorded

- 799 SAR, no tax wording. Formal heading font.
- No WhatsApp for the first 10 real-estate customers: ordering via portal, questions via the assistant.
- Chatbot / full-agency services out of scope for now; log every request, decide after the first 5 customers.
- CRM integration offered only as a separately quoted add-on.

## Open decisions (founder)

1. Strikethrough "990 / وفّر 191" on the offer page (discount-permit question).
2. Homepage and `/websites`: keep WhatsApp for the 990 package, or switch to portal.
3. `/websites` "ضمان الإطلاق خلال ٧ أيام أو استرداد كامل" — still intended?
4. Trust line "يُسجَّل النطاق باسم منشأتك" for the 799 offer.
5. Publicly linking Ketcode to Tayyar / Nawahel.
6. Which Stripe account is the live receiver (D2) and whether VAT applies (D3).
7. Delete the 3 test projects in the shared database.

## Next session: build Production (in order)

1. Live payment: confirm Stripe account; add a production payment link env (live `buy.stripe.com/...`) and show the pay button in Production with `client_reference_id`; set `FACTORY_STRIPE_VERIFY_KEY` + `FACTORY_STRIPE_VERIFY_LINK_ID` for Production; add a signed Stripe webhook so payment is recorded without staff entry; decide promo-code policy (verifier requires amount 79900).
2. Data: move applied WF SQL into `supabase/migrations/`; resolve B2 (separate preview DB or accept shared DB + delete test rows).
3. Supabase Auth for Production: site URL / redirect allow-list for ketcode.com, OTP email template, SMTP sender.
4. Production env on `ketcode-com`: `FACTORY_ENABLED=true`, `FACTORY_SUPABASE_URL`, `FACTORY_SUPABASE_PUBLISHABLE_KEY`, `FACTORY_STAFF_EMAILS` (secret key already set).
5. Visual QA of portal + all pages on mobile; end-to-end test on Preview with sandbox payment (PRD §20 tests 1–12 as far as they apply).
6. Merge plan: #3 → #4 → #5 → design branch into `main`; founder approval; Production deploy; live smoke test (home, offer, portal login, registration, staff board).

## Restart instruction

> Continue Ketcode Factory from `FACTORY_PROGRESS.md` on branch `design/ketcode-identity-v2` of TayyarCore/ketcode-web. Start "Next session: build Production" step 1, after confirming the Stripe account and that keys were rotated.
