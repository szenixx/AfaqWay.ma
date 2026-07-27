-- 04 · Indexes. Safe to re-run.
create index if not exists journey_stages_scope     on public.journey_stages (country, plan, sort_order);
create index if not exists journey_steps_stage      on public.journey_steps (stage_id, sort_order);
create index if not exists journey_blocks_step      on public.journey_blocks (step_id, sort_order);
create index if not exists journey_reminders_step   on public.journey_reminders (step_id);
create index if not exists journey_progress_user    on public.journey_progress (user_id);
create index if not exists journey_approvals_user   on public.journey_stage_approvals (user_id);
create index if not exists journey_versions_entity  on public.journey_versions (entity, entity_id, created_at desc);
