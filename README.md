# Ket Code AI Sales Assistant V1

Independent Next.js preview for a bilingual Arabic/English website-design sales assistant.

## Local setup

1. Install dependencies with `npm ci`.
2. Copy `.env.example` to `.env.local` and add the server-only credentials.
3. Run `npm run dev` and open `http://localhost:3000`.

The application fails closed when OpenRouter or Supabase credentials are missing. Never expose `OPENROUTER_API_KEY` or `SUPABASE_SECRET_KEY` with a `NEXT_PUBLIC_` prefix.

For the no-cost Preview configuration, set `OPENROUTER_MODEL=openrouter/free`. Free models have lower rate limits and are not intended for production traffic.

## Supabase

Lead storage uses the isolated `ketcode-leads` Supabase project. Apply the migration under `supabase/migrations`, then configure:

```bash
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_SECRET_KEY=sb_secret_...
```

Use a current secret key from the project settings, never a publishable key. The key is sent only from the server in the `apikey` header. The `leads` table has RLS enabled, grants no browser roles, and grants `INSERT` only to `service_role`. Lead rows are inserted only after the visitor checks the consent box.

## Checks

```bash
npm run lint
npm exec tsc -- --noEmit
npm run build
```

This repository is a standalone preview. It does not contain the full published Ket Code website and must not use Tayyar production data or credentials.
