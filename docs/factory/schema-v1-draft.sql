-- Ketcode Factory — schema V1 DRAFT
-- Status: NOT APPLIED. Kept outside supabase/migrations on purpose.
-- Target: the isolated Ketcode Factory Supabase project (preview DB first, see audit B1/B2).
-- Pattern: same as public.leads — tables in public, RLS enabled, no grants to anon/authenticated,
-- all access through server routes using the secret key with explicit ownership checks.
-- All changes are additive; the live /api/leads insert keeps working unchanged.

begin;

-- ---------- helpers ----------
create or replace function public.factory_touch_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at := now(); return new; end $$;

-- ---------- identity ----------
create table public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role text not null default 'client' check (role in ('operator', 'client')),
  display_name text check (char_length(display_name) <= 100),
  created_at timestamptz not null default now()
);

-- ---------- CRM ----------
create table public.contacts (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 2 and 100),
  email_normalized text check (email_normalized = lower(email_normalized)),
  phone_e164 text check (phone_e164 ~ '^\+[1-9][0-9]{7,14}$'),
  organization text check (char_length(organization) <= 160),
  is_test boolean not null default false,
  created_at timestamptz not null default now(),
  last_contacted_at timestamptz,
  check (email_normalized is not null or phone_e164 is not null)
);
create unique index contacts_email_uq on public.contacts (email_normalized) where email_normalized is not null;
create index contacts_phone_idx on public.contacts (phone_e164);

-- Extend the existing leads table (nullable columns only => live insert unaffected)
alter table public.leads
  add column contact_id uuid references public.contacts(id),
  add column status text not null default 'new'
    check (status in ('new', 'qualifying', 'qualified', 'not_fit', 'converted', 'closed')),
  add column summary text check (char_length(summary) <= 2000),
  add column business_type text check (char_length(business_type) <= 120),
  add column package_code text,
  add column utm jsonb check (utm is null or jsonb_typeof(utm) = 'object'),
  add column owner_user_id uuid references auth.users(id),
  add column next_step text check (char_length(next_step) <= 300),
  add column last_activity_at timestamptz not null default now(),
  add column is_test boolean not null default false;
create index leads_status_idx on public.leads (status, last_activity_at desc);

create table public.clients (
  id uuid primary key default gen_random_uuid(),
  display_name text not null check (char_length(display_name) between 2 and 160),
  primary_contact_id uuid references public.contacts(id),
  is_test boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.client_memberships (
  client_id uuid not null references public.clients(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (client_id, user_id)
);
-- V1: one portal user per client
create unique index client_memberships_one_user on public.client_memberships (client_id);

-- ---------- catalog ----------
create table public.packages (
  code text primary key,
  name_ar text not null,
  price_halalas integer not null check (price_halalas >= 0),
  currency text not null default 'SAR',
  revision_rounds integer not null default 2,
  mailboxes integer not null default 1,
  active boolean not null default true,
  created_at timestamptz not null default now()
);
-- Prices are founder decisions (D1). No rows are seeded by engineering.

create table public.templates (
  id text not null,
  version integer not null check (version > 0),
  category text not null,
  pages jsonb not null check (jsonb_typeof(pages) = 'array'),
  field_schema jsonb not null check (jsonb_typeof(field_schema) = 'object'),
  source_path text not null,
  build_verified_at timestamptz,
  status text not null default 'draft' check (status in ('draft', 'approved', 'retired')),
  created_at timestamptz not null default now(),
  primary key (id, version)
);

-- ---------- projects ----------
create table public.projects (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id),
  lead_id uuid unique references public.leads(id),   -- one project per converted lead
  name text not null check (char_length(name) between 2 and 160),
  package_code text references public.packages(code),
  template_id text,
  template_version integer,
  status text not null default 'INTAKE' check (status in (
    'INTAKE','READY','BUILDING','QA','PREVIEW_READY','REVISION','APPROVED',
    'PAYMENT_PENDING','LAUNCH_PREP','LIVE','DELIVERED','ON_HOLD','CANCELLED')),
  hold_reason text,
  payment_status text not null default 'UNPAID' check (payment_status in (
    'NOT_REQUIRED','UNPAID','PENDING','PAID','FAILED','REFUNDED','PARTIALLY_REFUNDED')),
  domain_status text not null default 'NOT_PROVIDED' check (domain_status in (
    'NOT_PROVIDED','AWAITING_CLIENT','CONFIGURING','VERIFYING','ACTIVE','ERROR')),
  email_status text not null default 'NOT_INCLUDED' check (email_status in (
    'NOT_INCLUDED','AWAITING_DETAILS','CONFIGURING','ACTIVE','ERROR')),
  sla_started_at timestamptz,
  sla_due_at timestamptz,
  sla_paused_at timestamptz,
  sla_pause_reason text,
  sla_paused_seconds integer not null default 0,
  completed_at timestamptz,
  is_test boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (template_id, template_version) references public.templates(id, version),
  check (status <> 'ON_HOLD' or hold_reason is not null),
  check (sla_due_at is null or sla_started_at is not null)
);
create trigger projects_touch before update on public.projects
  for each row execute function public.factory_touch_updated_at();
create index projects_client_idx on public.projects (client_id);
create index projects_status_idx on public.projects (status, sla_due_at);

create table public.project_requirements (
  project_id uuid not null references public.projects(id) on delete cascade,
  version integer not null check (version > 0),
  content jsonb not null check (jsonb_typeof(content) = 'object'),
  submitted_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  primary key (project_id, version)
);

-- ---------- production ----------
create table public.production_jobs (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id),
  requirements_version integer not null,
  template_id text not null,
  template_version integer not null,
  idempotency_key text not null,
  status text not null default 'queued' check (status in ('queued','running','succeeded','failed','cancelled')),
  attempt integer not null default 1,
  started_at timestamptz,
  finished_at timestamptz,
  commit_sha text,
  build_result jsonb,
  qa_report jsonb,
  known_issues text,
  error_log text,
  created_at timestamptz not null default now(),
  unique (project_id, idempotency_key),
  foreign key (project_id, requirements_version) references public.project_requirements(project_id, version),
  foreign key (template_id, template_version) references public.templates(id, version)
);
-- No two conflicting jobs on the same project at once (PRD §8.5)
create unique index production_jobs_one_active on public.production_jobs (project_id)
  where status in ('queued', 'running');

create table public.deployments (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id),
  production_job_id uuid references public.production_jobs(id),
  kind text not null check (kind in ('preview', 'production')),
  version_label text not null,
  url text not null check (url ~ '^https://'),
  provider_deployment_id text unique,
  verified_at timestamptz,
  created_at timestamptz not null default now(),
  unique (project_id, kind, version_label)
);

create table public.approvals (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id),
  deployment_id uuid not null references public.deployments(id),
  decision text not null check (decision in ('approved', 'changes_requested')),
  notes text check (char_length(notes) <= 4000),
  decided_by uuid not null references auth.users(id),
  created_at timestamptz not null default now()
);
-- At most one approval per preview version
create unique index approvals_one_approved on public.approvals (deployment_id) where decision = 'approved';

-- ---------- money ----------
create table public.payments (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id),
  package_code text not null references public.packages(code),
  amount_halalas integer not null check (amount_halalas >= 0),
  currency text not null default 'SAR',
  discount_halalas integer not null default 0 check (discount_halalas >= 0),
  discount_reason text,
  provider text not null,
  provider_checkout_id text unique,
  provider_payment_id text unique,
  status text not null default 'PENDING' check (status in ('PENDING','PAID','FAILED','REFUNDED','PARTIALLY_REFUNDED')),
  is_sandbox boolean not null,
  verified_at timestamptz,
  created_at timestamptz not null default now(),
  check (discount_halalas = 0 or discount_reason is not null),
  check (status <> 'PAID' or verified_at is not null)
);

create table public.payment_webhook_events (
  provider text not null,
  provider_event_id text not null,
  received_at timestamptz not null default now(),
  signature_valid boolean not null,
  payload jsonb not null,
  processed_at timestamptz,
  primary key (provider, provider_event_id)   -- replayed webhook => no-op
);

-- ---------- delivery ----------
create table public.domains (
  project_id uuid primary key references public.projects(id),
  hostname text not null unique check (hostname ~ '^[a-z0-9.-]+\.[a-z]{2,}$'),
  path text not null check (path in ('client_owned', 'purchase_for_client')),
  registrar_name text,
  owner_of_record text,
  client_authorized_at timestamptz,
  existing_mx jsonb,                       -- captured BEFORE any DNS change (PRD §11.4)
  dns_instructions jsonb,
  https_verified_at timestamptz,
  updated_at timestamptz not null default now()
);

create table public.email_services (
  project_id uuid primary key references public.projects(id),
  provider text,
  mailboxes jsonb not null default '[]' check (jsonb_typeof(mailboxes) = 'array'),
  records_configured jsonb,
  send_test_passed_at timestamptz,
  receive_test_passed_at timestamptz,
  renewal_policy text,
  updated_at timestamptz not null default now()
);

-- ---------- audit ----------
create table public.events (
  id bigint generated always as identity primary key,
  occurred_at timestamptz not null default now(),
  actor_user_id uuid references auth.users(id),
  actor_kind text not null check (actor_kind in ('operator','client','system','webhook','assistant')),
  entity_type text not null check (entity_type in ('lead','contact','client','project','job','deployment','approval','payment','domain','email')),
  entity_id text not null,
  project_id uuid references public.projects(id),
  type text not null check (char_length(type) <= 80),
  payload jsonb not null default '{}' check (jsonb_typeof(payload) = 'object'),
  dedupe_key text unique                       -- prevents duplicate events / notifications on replay
);
create index events_project_idx on public.events (project_id, occurred_at);

create or replace function public.factory_events_append_only()
returns trigger language plpgsql as $$
begin raise exception 'events are append-only'; end $$;
create trigger events_no_update before update or delete on public.events
  for each row execute function public.factory_events_append_only();

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  event_id bigint not null references public.events(id),
  audience text not null check (audience in ('client', 'operator')),
  channel text not null default 'email' check (channel in ('email')),
  recipient text not null,
  template text not null,
  status text not null default 'pending' check (status in ('pending','sent','failed','skipped')),
  attempts integer not null default 0,
  sent_at timestamptz,
  unique (event_id, audience, template)       -- one message per event per audience
);

-- ---------- shared rate limit (replaces in-memory limiter) ----------
create table public.rate_limits (
  bucket text primary key,
  window_start timestamptz not null,
  count integer not null
);
create or replace function public.rate_limit_hit(p_bucket text, p_limit integer, p_window_seconds integer)
returns boolean language plpgsql security definer set search_path = public as $$
declare v_count integer;
begin
  insert into rate_limits as r (bucket, window_start, count) values (p_bucket, now(), 1)
  on conflict (bucket) do update set
    count = case when r.window_start < now() - make_interval(secs => p_window_seconds) then 1 else r.count + 1 end,
    window_start = case when r.window_start < now() - make_interval(secs => p_window_seconds) then now() else r.window_start end
  returning count into v_count;
  return v_count > p_limit;
end $$;

-- ---------- lock down ----------
do $$
declare t text;
begin
  foreach t in array array['profiles','contacts','clients','client_memberships','packages','templates',
    'projects','project_requirements','production_jobs','deployments','approvals','payments',
    'payment_webhook_events','domains','email_services','events','notifications','rate_limits']
  loop
    execute format('alter table public.%I enable row level security', t);
    execute format('revoke all on table public.%I from public, anon, authenticated', t);
    execute format('grant select, insert, update on table public.%I to service_role', t);
  end loop;
end $$;
revoke update on table public.events from service_role;
revoke all on function public.rate_limit_hit(text, integer, integer) from public, anon, authenticated;
grant execute on function public.rate_limit_hit(text, integer, integer) to service_role;
-- Existing leads table: server needs to read/update for the CRM
grant select, update on table public.leads to service_role;

commit;
