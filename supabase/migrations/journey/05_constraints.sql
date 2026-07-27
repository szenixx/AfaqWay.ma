-- 05 · Constraints and triggers, added separately so a re-run never fails.

-- Value constraints
alter table public.journey_stages          drop constraint if exists journey_stages_plan_ck;
alter table public.journey_stages          add  constraint journey_stages_plan_ck   check (plan in ('self_service','full_service'));
alter table public.journey_stages          drop constraint if exists journey_stages_status_ck;
alter table public.journey_stages          add  constraint journey_stages_status_ck check (status in ('draft','published','archived'));

alter table public.journey_steps           drop constraint if exists journey_steps_status_ck;
alter table public.journey_steps           add  constraint journey_steps_status_ck  check (status in ('draft','published','archived'));

alter table public.journey_blocks          drop constraint if exists journey_blocks_audience_ck;
alter table public.journey_blocks          add  constraint journey_blocks_audience_ck check (audience in ('student','advisor'));

alter table public.journey_progress        drop constraint if exists journey_progress_state_ck;
alter table public.journey_progress        add  constraint journey_progress_state_ck check (state in ('pending','in_progress','completed'));

alter table public.journey_stage_approvals drop constraint if exists journey_approvals_state_ck;
alter table public.journey_stage_approvals add  constraint journey_approvals_state_ck check (state in ('waiting','approved','rejected'));

-- One progress row per student per step, one approval per student per stage.
create unique index if not exists journey_progress_unique  on public.journey_progress (user_id, step_id);
create unique index if not exists journey_approvals_unique on public.journey_stage_approvals (user_id, stage_id);

-- updated_at triggers
drop trigger if exists journey_stages_touch on public.journey_stages;
create trigger journey_stages_touch before update on public.journey_stages
  for each row execute function public.journey_touch();

drop trigger if exists journey_steps_touch on public.journey_steps;
create trigger journey_steps_touch before update on public.journey_steps
  for each row execute function public.journey_touch();

drop trigger if exists journey_blocks_touch on public.journey_blocks;
create trigger journey_blocks_touch before update on public.journey_blocks
  for each row execute function public.journey_touch();

drop trigger if exists journey_progress_touch on public.journey_progress;
create trigger journey_progress_touch before update on public.journey_progress
  for each row execute function public.journey_touch();
