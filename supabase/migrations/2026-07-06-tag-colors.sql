-- Trading Journal — migration: colored setup/news tags (2026-07-06)
-- Run once in the Supabase SQL editor against the existing database.
-- (Fresh installs get this via the updated supabase/schema.sql instead.)

alter table setups add column if not exists color text not null default 'gray';

create table if not exists news_tags (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name text not null,
  color text not null default 'gray',
  created_at timestamptz not null default now(),
  unique (user_id, name)
);

alter table news_tags enable row level security;

create policy "own news_tags" on news_tags for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());

grant all on news_tags to authenticated;
