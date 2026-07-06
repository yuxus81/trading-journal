-- Trading Journal — Supabase schema.
-- Run once in the Supabase SQL editor. If a policy/grant name must differ for the
-- running Supabase version, adjust it and note the change here.

-- ACCOUNTS
create table accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name text not null,
  account_type text not null default 'prop',      -- 'prop' | 'live' | 'demo'
  starting_capital numeric not null default 0,
  currency text not null default 'USD',
  created_at timestamptz not null default now()
);

-- CASH EVENTS (payouts, resets, deposits/withdrawals, fees, manual corrections)
create table cash_events (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references accounts(id) on delete cascade,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  type text not null,                              -- 'payout' | 'reset' | 'deposit' | 'withdrawal' | 'fee' | 'adjustment'
  amount numeric not null,                         -- signed (withdrawal/fee negative, deposit positive)
  event_date date not null,
  note text,
  created_at timestamptz not null default now()
);

-- TRADES
create table trades (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references accounts(id) on delete cascade,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  asset text not null,                             -- e.g. 'MNQ', 'MES' or custom
  trade_date date not null,
  exec_time time,                                  -- execution time of day
  pnl numeric not null,                            -- typed manually
  rating smallint check (rating between 1 and 5),
  news jsonb not null default '[]'::jsonb,         -- array of tag strings, e.g. ["CPI 14:30","FOMC week"]
  direction text check (direction in ('long','short')),  -- optional
  r_multiple numeric,                              -- typed manually, optional
  setup text,                                      -- tag, optional
  confidence smallint check (confidence between 1 and 10),  -- optional
  notes text,                                      -- psychology / mistake notes, optional
  created_at timestamptz not null default now()
);

-- TRADE IMAGES (multiple screenshots per trade)
create table trade_images (
  id uuid primary key default gen_random_uuid(),
  trade_id uuid not null references trades(id) on delete cascade,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  storage_path text not null,                      -- path in the storage bucket
  created_at timestamptz not null default now()
);

-- SETUPS (reusable, colored tags for the setup field)
create table setups (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name text not null,
  color text not null default 'gray'
);

-- NEWS TAGS (reusable, colored tags for the trade's "news of the day" field)
create table news_tags (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name text not null,
  color text not null default 'gray',
  created_at timestamptz not null default now(),
  unique (user_id, name)
);

-- Enable RLS
alter table accounts     enable row level security;
alter table cash_events  enable row level security;
alter table trades       enable row level security;
alter table trade_images enable row level security;
alter table setups       enable row level security;
alter table news_tags    enable row level security;

-- RLS policies: only own rows
create policy "own accounts"     on accounts     for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "own cash_events"  on cash_events  for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "own trades"       on trades       for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "own trade_images" on trade_images for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "own setups"       on setups       for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "own news_tags"    on news_tags    for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Grants for the Data API (required for projects created after 2026-05-30)
grant usage on schema public to authenticated;
grant all on accounts, cash_events, trades, trade_images, setups, news_tags to authenticated;

-- Storage bucket for images (private)
insert into storage.buckets (id, name, public) values ('trade-images','trade-images', false)
on conflict (id) do nothing;

create policy "own images read"   on storage.objects for select using (bucket_id = 'trade-images' and owner = auth.uid());
create policy "own images insert" on storage.objects for insert with check (bucket_id = 'trade-images' and owner = auth.uid());
create policy "own images delete" on storage.objects for delete using (bucket_id = 'trade-images' and owner = auth.uid());
