-- Apply only to the dedicated Ketcode Preview database.
create table public.white_friday_projects (
  id uuid primary key,
  name text not null check (char_length(name) between 2 and 100),
  email text not null check (char_length(email) between 3 and 254),
  template text not null check (template in ('office', 'projects')),
  access_hash text not null check (access_hash ~ '^[0-9a-f]{64}$'),
  stage text not null default 'received' check (stage in ('received', 'building', 'review', 'paid', 'launched')),
  preview_url text check (preview_url is null or preview_url like 'https://%'),
  approved_preview_url text check (approved_preview_url is null or approved_preview_url like 'https://%'),
  created_at timestamptz not null default now(),
  check (stage not in ('review', 'paid', 'launched') or preview_url is not null),
  check (stage not in ('paid', 'launched') or
    (approved_preview_url is not null and approved_preview_url = preview_url))
);

alter table public.white_friday_projects enable row level security;
revoke all on public.white_friday_projects from public, anon, authenticated;
grant select, insert, update on public.white_friday_projects to service_role;

-- Materials are private; never include logo_data in public responses.
alter table public.white_friday_projects
  add column reference_urls text[] not null default '{}' check (cardinality(reference_urls) <= 5),
  add column logo_name text check (char_length(logo_name) <= 120),
  add column logo_data text check (char_length(logo_data) <= 699052),
  add check ((logo_name is null) = (logo_data is null));
