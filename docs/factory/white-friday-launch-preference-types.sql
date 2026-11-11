alter table public.white_friday_projects
  add column launch_domain_type text check (launch_domain_type in ('existing','new')),
  add column launch_email_type text check (launch_email_type in ('mailbox','forwarding'));
