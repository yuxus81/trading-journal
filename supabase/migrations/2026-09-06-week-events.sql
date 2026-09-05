-- Trading Journal — migration: weekly-event tags (2026-09-06)
-- Run once in the Supabase SQL editor against the existing database.
-- (Fresh installs get this via the updated supabase/schema.sql instead.)
--
-- Adds a second, independent tag list next to news_tags for recurring weekly
-- context (e.g. "CPI-Week", "NFP-Week"), plus the column that stores a trade's
-- selected week events. Until this runs, the "Wochen-Events" picker shows no
-- options and the field is silently dropped on save.

create table if not exists week_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name text not null,
  color text not null default 'gray',
  created_at timestamptz not null default now(),
  unique (user_id, name)
);

alter table week_events enable row level security;

create policy "own week_events" on week_events for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());

grant all on week_events to authenticated;

alter table trades add column if not exists week_events jsonb not null default '[]'::jsonb;
