create table public.leads (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  language text not null check (language in ('ar', 'en')),
  name text not null check (char_length(name) between 2 and 100),
  contact_method text not null check (contact_method in ('email', 'phone', 'whatsapp')),
  contact text not null check (char_length(contact) between 5 and 160),
  source_page text not null check (char_length(source_page) <= 500),
  session_id text not null unique check (char_length(session_id) between 16 and 128),
  service text not null default 'website-design' check (service = 'website-design'),
  conversation jsonb not null check (jsonb_typeof(conversation) = 'array'),
  consent_at timestamptz not null,
  sales_notification_email text not null default 'info@ketcode.com'
);

comment on table public.leads is 'Consented Ket Code website-design leads submitted through the server-only sales assistant endpoint.';
comment on column public.leads.conversation is 'Validated assistant transcript stored as a JSON array.';

create index leads_created_at_idx on public.leads (created_at desc);

alter table public.leads enable row level security;

revoke all on table public.leads from public, anon, authenticated, service_role;
grant insert on table public.leads to service_role;
