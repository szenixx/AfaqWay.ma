-- Journey engine — complete install, in dependency order.
-- Paste this whole file into the Supabase SQL editor and run it.
-- Safe to run more than once. If it fails, run 01…08 individually to isolate.

-- ═══════════════════════════════════════════════════ 01_extensions
-- 01 · Extensions. Safe to re-run.
create extension if not exists pgcrypto;   -- gen_random_uuid()

-- ═══════════════════════════════════════════════════ 02_functions
-- 02 · Helper functions. No table dependencies, safe to re-run.

-- An admin is a non-banned row in public.admins matching the caller's email.
-- Written defensively: if public.admins is missing the function returns false
-- instead of erroring, so policies never break.
create or replace function public.is_admin()
returns boolean
language plpgsql
stable
security definer
set search_path = public
as $fn$
declare
  ok boolean := false;
begin
  begin
    select exists (
      select 1
        from public.admins a
       where lower(a.email) = lower(coalesce(auth.jwt() ->> 'email', ''))
         and coalesce(a.banned, false) = false
    ) into ok;
  exception when undefined_table or undefined_column then
    ok := false;
  end;
  return coalesce(ok, false);
end;
$fn$;

-- Keeps updated_at honest on every write.
create or replace function public.journey_touch()
returns trigger
language plpgsql
as $fn$
begin
  new.updated_at := now();
  return new;
end;
$fn$;

-- ═══════════════════════════════════════════════════ 03_tables
-- 03 · Tables, in dependency order. Safe to re-run.
--
-- Column names deliberately avoid PostgreSQL keywords and function names:
-- sort_order (not "position"), repeat_rule (not "repeat"),
-- prev_value / next_value (not "previous"/"next"), review_comment (not "comment").
-- user_id has no foreign key to auth.users on purpose: it needs no cascade here
-- and referencing another schema is the most common cause of a failed run.

create table if not exists public.journey_stages (
  id           uuid primary key default gen_random_uuid(),
  country      text not null default 'LT',
  plan         text not null default 'self_service',
  sort_order   integer not null default 0,
  title        text not null,
  description  text not null default '',
  icon         text not null default 'route',
  tone         text not null default 'blue',
  status       text not null default 'draft',
  rules        jsonb not null default '{}'::jsonb,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create table if not exists public.journey_steps (
  id             uuid primary key default gen_random_uuid(),
  stage_id       uuid not null references public.journey_stages (id) on delete cascade,
  sort_order     integer not null default 0,
  title          text not null,
  subtitle       text not null default '',
  description    text not null default '',
  status         text not null default 'draft',
  required       boolean not null default true,
  estimated_time text not null default '',
  due_at         timestamptz,
  document_keys  text[] not null default '{}'::text[],
  rules          jsonb not null default '{}'::jsonb,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create table if not exists public.journey_blocks (
  id          uuid primary key default gen_random_uuid(),
  step_id     uuid not null references public.journey_steps (id) on delete cascade,
  sort_order  integer not null default 0,
  kind        text not null default 'paragraph',
  enabled     boolean not null default true,
  title       text not null default '',
  body        text not null default '',
  data        jsonb not null default '{}'::jsonb,
  audience    text not null default 'student',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table if not exists public.journey_reminders (
  id          uuid primary key default gen_random_uuid(),
  step_id     uuid not null references public.journey_steps (id) on delete cascade,
  kind        text not null default 'custom',
  title       text not null,
  message     text not null default '',
  due_at      timestamptz,
  repeat_rule text not null default 'none',
  priority    text not null default 'normal',
  channels    text[] not null default '{dashboard}'::text[],
  enabled     boolean not null default true,
  created_at  timestamptz not null default now()
);

create table if not exists public.journey_progress (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null,
  step_id      uuid not null references public.journey_steps (id) on delete cascade,
  state        text not null default 'pending',
  completed_at timestamptz,
  updated_at   timestamptz not null default now()
);

create table if not exists public.journey_stage_approvals (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null,
  stage_id       uuid not null references public.journey_stages (id) on delete cascade,
  state          text not null default 'waiting',
  reviewed_by    uuid,
  reviewed_at    timestamptz,
  review_comment text not null default '',
  created_at     timestamptz not null default now()
);

create table if not exists public.journey_versions (
  id           uuid primary key default gen_random_uuid(),
  entity       text not null,
  entity_id    uuid not null,
  editor_email text,
  field        text,
  prev_value   jsonb,
  next_value   jsonb,
  summary      text not null default '',
  created_at   timestamptz not null default now()
);

-- ═══════════════════════════════════════════════════ 04_indexes
-- 04 · Indexes. Safe to re-run.
create index if not exists journey_stages_scope     on public.journey_stages (country, plan, sort_order);
create index if not exists journey_steps_stage      on public.journey_steps (stage_id, sort_order);
create index if not exists journey_blocks_step      on public.journey_blocks (step_id, sort_order);
create index if not exists journey_reminders_step   on public.journey_reminders (step_id);
create index if not exists journey_progress_user    on public.journey_progress (user_id);
create index if not exists journey_approvals_user   on public.journey_stage_approvals (user_id);
create index if not exists journey_versions_entity  on public.journey_versions (entity, entity_id, created_at desc);

-- ═══════════════════════════════════════════════════ 05_constraints
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

-- ═══════════════════════════════════════════════════ 06_rls
-- 06 · Enable row level security. Safe to re-run.
alter table public.journey_stages          enable row level security;
alter table public.journey_steps           enable row level security;
alter table public.journey_blocks          enable row level security;
alter table public.journey_reminders       enable row level security;
alter table public.journey_progress        enable row level security;
alter table public.journey_stage_approvals enable row level security;
alter table public.journey_versions        enable row level security;

-- ═══════════════════════════════════════════════════ 07_policies
-- 07 · Policies. Plain drop-then-create, no DO blocks, so every statement is
-- independent and a re-run is always clean.
--
-- Students read published configuration and their own progress.
-- Admins (public.is_admin()) read and write everything.

-- Stages
drop policy if exists "journey_stages_read"  on public.journey_stages;
create policy "journey_stages_read" on public.journey_stages
  for select to authenticated using (status = 'published' or public.is_admin());
drop policy if exists "journey_stages_write" on public.journey_stages;
create policy "journey_stages_write" on public.journey_stages
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- Steps
drop policy if exists "journey_steps_read"  on public.journey_steps;
create policy "journey_steps_read" on public.journey_steps
  for select to authenticated using (status = 'published' or public.is_admin());
drop policy if exists "journey_steps_write" on public.journey_steps;
create policy "journey_steps_write" on public.journey_steps
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- Blocks: advisor-only content never reaches a student.
drop policy if exists "journey_blocks_read"  on public.journey_blocks;
create policy "journey_blocks_read" on public.journey_blocks
  for select to authenticated using ((enabled and audience = 'student') or public.is_admin());
drop policy if exists "journey_blocks_write" on public.journey_blocks;
create policy "journey_blocks_write" on public.journey_blocks
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- Reminders
drop policy if exists "journey_reminders_read"  on public.journey_reminders;
create policy "journey_reminders_read" on public.journey_reminders
  for select to authenticated using (enabled or public.is_admin());
drop policy if exists "journey_reminders_write" on public.journey_reminders;
create policy "journey_reminders_write" on public.journey_reminders
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- Progress: own rows only.
drop policy if exists "journey_progress_read"   on public.journey_progress;
create policy "journey_progress_read" on public.journey_progress
  for select to authenticated using (user_id = auth.uid() or public.is_admin());
drop policy if exists "journey_progress_insert" on public.journey_progress;
create policy "journey_progress_insert" on public.journey_progress
  for insert to authenticated with check (user_id = auth.uid() or public.is_admin());
drop policy if exists "journey_progress_update" on public.journey_progress;
create policy "journey_progress_update" on public.journey_progress
  for update to authenticated using (user_id = auth.uid() or public.is_admin())
  with check (user_id = auth.uid() or public.is_admin());

-- Approvals: a student may look, only an admin may decide.
drop policy if exists "journey_approvals_read"   on public.journey_stage_approvals;
create policy "journey_approvals_read" on public.journey_stage_approvals
  for select to authenticated using (user_id = auth.uid() or public.is_admin());
drop policy if exists "journey_approvals_insert" on public.journey_stage_approvals;
create policy "journey_approvals_insert" on public.journey_stage_approvals
  for insert to authenticated with check (user_id = auth.uid() or public.is_admin());
drop policy if exists "journey_approvals_write"  on public.journey_stage_approvals;
create policy "journey_approvals_write" on public.journey_stage_approvals
  for update to authenticated using (public.is_admin()) with check (public.is_admin());

-- Version history is admin-only.
drop policy if exists "journey_versions_read"  on public.journey_versions;
create policy "journey_versions_read" on public.journey_versions
  for select to authenticated using (public.is_admin());
drop policy if exists "journey_versions_write" on public.journey_versions;
create policy "journey_versions_write" on public.journey_versions
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- ═══════════════════════════════════════════════════ content
-- The journey content is NOT seeded here. It comes from the Excel source of
-- truth via scripts/import-journey.mjs, which generates
-- 12_journey_content_lt_bachelor.sql. Run that after this file.
--
-- The five placeholder stages that used to live here were removed on
-- 27 July 2026; 13_retire_seed_journey.sql deletes them from any database that
-- already has them.

notify pgrst, 'reload schema';
