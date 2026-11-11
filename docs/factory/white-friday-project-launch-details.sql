alter table public.white_friday_projects
  add column launch_due_at timestamptz,
  add column launch_domain text check (char_length(launch_domain) <= 253),
  add column launch_email_alias text check (launch_email_alias in ('info','contact','team')),
  add column test_payment boolean not null default false,
  add constraint white_friday_launch_details_pair check ((launch_domain is null) = (launch_email_alias is null));
