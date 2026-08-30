-- 23 · Schedule event end time.
--
-- Additive only. An event previously had a single time (its start); the Add
-- Event mini-module now also asks for when it ends, so a meeting or interview
-- can show a duration instead of a single instant.
--
-- Safe to run more than once.

alter table public.schedule_events add column if not exists event_end_time text;

notify pgrst, 'reload schema';
