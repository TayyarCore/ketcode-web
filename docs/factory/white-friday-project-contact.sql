alter table public.white_friday_projects
  add column contact_name text check (char_length(contact_name) between 2 and 100),
  add column contact_phone text check (contact_phone ~ '^\+?[1-9][0-9]{7,14}$'),
  add constraint white_friday_contact_pair check ((contact_name is null) = (contact_phone is null));
