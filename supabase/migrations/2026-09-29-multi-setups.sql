-- Trading Journal — migration: multiple setups per trade (2026-09-29)
-- Run once in the Supabase SQL editor against the existing database.
-- (Fresh installs get this via the updated supabase/schema.sql instead.)
--
-- Replaces the single "setup" text column with a "setups" jsonb array, so a
-- trade can be tagged with more than one strategy — same shape as
-- news / week_events. Existing values are migrated into a one-element array.

alter table trades add column if not exists setups jsonb not null default '[]'::jsonb;

update trades
set setups = jsonb_build_array(setup)
where setup is not null and setups = '[]'::jsonb;

alter table trades drop column if exists setup;
