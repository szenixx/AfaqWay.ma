-- 13 · Retire the placeholder journey and restart every student.
--
-- DESTRUCTIVE ON PURPOSE. Read this before running it.
--
-- The journey now comes from the Excel (migration 12). The five placeholder
-- stages seeded in 08_seed.sql are still published beside it, so students see
-- seven stages per plan with colliding sort orders. This removes them and puts
-- everyone back at the start of the real journey.
--
-- What is deleted:
--   · every LT stage that did not come from the Excel, with its steps, content
--     blocks and reminders (cascade)
--   · every student's journey progress, stage approvals and event timeline
--
-- What is kept:
--   · journey_documents — uploaded files stay, so a student who already sent a
--     passport does not have to send it again. The upload reattaches to the
--     matching requirement by (step_id, doc_key).
--   · everything outside the journey: profiles, payments, chat, schedule.
--
-- Safe to run more than once: after the first run there is nothing left to
-- delete and the counts come back zero.

do $$
declare
  removed_stages int;
  removed_progress int;
  removed_approvals int;
  removed_events int;
  orphan_documents int;
begin
  /* 1 · The placeholder stages. Anything imported carries rules->>'source'
         = 'xlsx'; anything else in LT is the old seed. Steps, blocks,
         reminders, progress and documents below them go with the cascade. */
  with gone as (
    delete from public.journey_stages
     where country = 'LT'
       and coalesce(rules ->> 'source', '') <> 'xlsx'
    returning 1
  )
  select count(*) into removed_stages from gone;

  /* 2 · Everyone restarts. The Excel journey is a different set of steps, so
         progress against the old one is meaningless, and a half-finished mix
         of the two would leave stages unlocked that were never done. */
  with gone as (delete from public.journey_progress returning 1)
  select count(*) into removed_progress from gone;

  with gone as (delete from public.journey_stage_approvals returning 1)
  select count(*) into removed_approvals from gone;

  with gone as (delete from public.journey_events returning 1)
  select count(*) into removed_events from gone;

  /* 3 · Uploads whose step no longer exists cannot be reattached to anything.
         The file itself stays in storage; only the dangling row goes. */
  with gone as (
    delete from public.journey_documents d
     where d.step_id is not null
       and not exists (select 1 from public.journey_steps s where s.id = d.step_id)
    returning 1
  )
  select count(*) into orphan_documents from gone;

  raise notice 'Retired % placeholder stage(s)', removed_stages;
  raise notice 'Reset % progress row(s), % stage approval(s), % timeline event(s)',
    removed_progress, removed_approvals, removed_events;
  raise notice 'Removed % orphaned document row(s); files in storage were not touched', orphan_documents;
end $$;

-- What every student should see now: the Excel journey, and nothing else.
select plan, sort_order, title, status
  from public.journey_stages
 where country = 'LT'
 order by plan, sort_order;

notify pgrst, 'reload schema';
