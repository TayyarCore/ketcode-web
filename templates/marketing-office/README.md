# Ketcode Real Estate Marketing Template 01

**Status: private candidate / not approved for sale or Production.**

Derived from the visual system of Nawahel's website (Arabic Tajawal typography, navy/copper palette, RTL, marketing-office service cards) but implemented as a standalone, client-neutral static template in Ketcode's repository. The Nawahel website and all its integrations remain unchanged.

## Customization (one file)
Edit `customer.config.js` with approved client name, description, color values, actual services, and independent customer contact details. Optional logo must be a separately licensed/owned asset at a relative path under the customer's site. No hardcoded Nawahel contact information, customer records, licenses or keys are included.

The template is intentionally **read-only marketing content**, with email / WhatsApp / phone direct links. It has **no database or inbound contact form**; this avoids accidentally sending customer inquiries to Nawahel or Tayyar. A future form needs separate acceptance tests and customer-owned receiving channel, not a copy of Nawahel's API.

`index.html` has `noindex,nofollow` so prototype deployments are not indexed. Remove that only after explicit customer launch approval, legal content verification and deployment validation.

## Acceptance before client delivery
- [ ] Client-approved text, logo, images, services and legal details
- [ ] Real customer contact details verified; placeholder labels removed
- [ ] No Nawahel phone/email/brand/licensing/API/storage in rendered page or network
- [ ] Safe and functional mobile navigation, RTL layout, accessibility and responsive view
- [ ] Working contact action to the correct customer recipient/number
- [ ] SEO title and metadata verified; noindex kept on private Preview
- [ ] Test an independent publish on a customer-specific hostname, HTTPS and rollback
- [ ] Confirm 72-hour promise starts after payment and approved content, per commercial terms

## Deployment
This folder is *source material only*, not an active Next.js route. Do not merge to main or deploy to Production. For an isolated test, copy these four files to an independent static preview deployment. The root file `index.html` loads only the local `style.css`, `customer.config.js` and `template.js`. No Stripe, Supabase, Resend or Tayyar keys are necessary.

## Commercial scope
Ketcode fixed-scope marketing-office website. Current proposed launch price: SAR 799 final, subject to approved terms, tax treatment and payment validation. Live listings, inventory sync, automatic updates, booking workflows and Tayyar integration are **not included**.
