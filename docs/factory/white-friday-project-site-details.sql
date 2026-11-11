alter table public.white_friday_projects
  add column city text check (char_length(city) between 2 and 100),
  add column map_url text check (map_url like 'https://%' and char_length(map_url) <= 2048),
  add column social_links text[] not null default '{}' check (cardinality(social_links) <= 6),
  add column working_hours text check (char_length(working_hours) <= 500);
