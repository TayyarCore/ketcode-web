alter table public.white_friday_projects
  add column commercial_registration text check (commercial_registration ~ '^[0-9]{1,30}$'),
  add column fal_license text check (fal_license ~ '^[0-9]{1,30}$');
