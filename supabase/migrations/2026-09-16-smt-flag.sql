-- Trading Journal — migration: SMT confluence flag (2026-09-16)
-- Run once in the Supabase SQL editor against the existing database.
-- (Fresh installs get this via the updated supabase/schema.sql instead.)
--
-- SMT was previously baked into separate setup names ("Key Level Sweep + SMT
-- -> CISD" next to plain "Key Level Sweep -> CISD"), which duplicated every
-- strategy and split its stats in two. This folds SMT into its own boolean
-- flag on the trade and collapses each "+ SMT" setup back onto its raw
-- strategy name.

alter table trades add column if not exists smt boolean not null default false;

-- Move the SMT confluence onto the new flag and rewrite the setup name back
-- to the raw strategy (e.g. "Higher TF FVG + SMT -> CISD" -> smt = true,
-- setup = "Higher TF FVG -> CISD").
update trades
set smt = true,
    setup = trim(regexp_replace(setup, '\s*\+\s*SMT\s*', ' ', 'g'))
where setup ~* '\+\s*SMT';

-- Some "+ SMT" setups had no plain counterpart yet — create the raw setup
-- row so the picker still offers it.
insert into setups (user_id, name, color)
select distinct s.user_id,
       trim(regexp_replace(s.name, '\s*\+\s*SMT\s*', ' ', 'g')) as base_name,
       s.color
from setups s
where s.name ~* '\+\s*SMT'
  and not exists (
    select 1 from setups s2
    where s2.user_id = s.user_id
      and s2.name = trim(regexp_replace(s.name, '\s*\+\s*SMT\s*', ' ', 'g'))
  );

-- Drop the now-unused "+ SMT" setup rows.
delete from setups where name ~* '\+\s*SMT';
