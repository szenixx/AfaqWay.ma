-- 09 · Review workflow, student documents and the action timeline.
--
-- Strictly ADDITIVE. No existing table is restructured, no column is dropped or
-- renamed, no relationship changes. Everything here is a new nullable column, a
-- widened check, or a new table. Safe to run more than once.
--
-- Step document REQUIREMENTS are not stored here: they live in
-- journey_steps.rules -> 'documents', so the admin can define them without any
-- further migration. This file stores what a student actually uploads.

-- ── journey_progress: submission and review detail ──────────────────────────
alter table public.journey_progress add column if not exists submitted_at    timestamptz;
alter table public.journey_progress add column if not exists reviewed_at     timestamptz;
alter table public.journey_progress add column if not exists reviewed_by     uuid;
alter table public.journey_progress add column if not exists student_comment text not null default '';
alter table public.journey_progress add column if not exists review_comment  text not null default '';
alter table public.journey_progress add column if not exists advisor_note    text not null default '';

-- A step can now also be rejected by an advisor or skipped when the step allows it.
alter table public.journey_progress drop constraint if exists journey_progress_state_ck;
alter table public.journey_progress add  constraint journey_progress_state_ck
  check (state in ('pending','in_progress','completed','rejected','skipped'));

-- ── Student document uploads ────────────────────────────────────────────────
-- One row per requirement per student. Re-uploading replaces the file on the
-- same row, so a step always has one current document and a clear status.
create table if not exists public.journey_documents (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null,
  step_id        uuid references public.journey_steps (id) on delete cascade,
  doc_key        text not null,
  name           text not null default '',
  file_path      text not null default '',
  file_name      text not null default '',
  mime_type      text not null default '',
  size_bytes     bigint not null default 0,
  status         text not null default 'pending',
  review_comment text not null default '',
  reviewed_by    uuid,
  reviewed_at    timestamptz,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

alter table public.journey_documents drop constraint if exists journey_documents_status_ck;
alter table public.journey_documents add  constraint journey_documents_status_ck
  check (status in ('pending','uploaded','under_review','needs_changes','approved'));

create index if not exists journey_documents_user on public.journey_documents (user_id);
create index if not exists journey_documents_step on public.journey_documents (step_id);
create unique index if not exists journey_documents_unique
  on public.journey_documents (user_id, step_id, doc_key);

drop trigger if exists journey_documents_touch on public.journey_documents;
create trigger journey_documents_touch before update on public.journey_documents
  for each row execute function public.journey_touch();

-- ── Action timeline ─────────────────────────────────────────────────────────
-- Append-only record of what happened on a step, for the admin review modal and
-- the student's own history. Never updated, only inserted.
create table if not exists public.journey_events (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null,
  step_id     uuid references public.journey_steps (id) on delete cascade,
  stage_id    uuid references public.journey_stages (id) on delete cascade,
  kind        text not null default 'note',
  actor       text not null default 'student',
  actor_email text,
  message     text not null default '',
  created_at  timestamptz not null default now()
);

alter table public.journey_events drop constraint if exists journey_events_actor_ck;
alter table public.journey_events add  constraint journey_events_actor_ck
  check (actor in ('student','admin','system'));

create index if not exists journey_events_user on public.journey_events (user_id, created_at desc);
create index if not exists journey_events_step on public.journey_events (step_id, created_at desc);

-- ── Row level security ──────────────────────────────────────────────────────
alter table public.journey_documents enable row level security;
alter table public.journey_events    enable row level security;

-- Documents: a student sees and uploads only their own; only an admin verifies.
drop policy if exists "journey_documents_read" on public.journey_documents;
create policy "journey_documents_read" on public.journey_documents
  for select to authenticated using (user_id = auth.uid() or public.is_admin());
drop policy if exists "journey_documents_insert" on public.journey_documents;
create policy "journey_documents_insert" on public.journey_documents
  for insert to authenticated with check (user_id = auth.uid() or public.is_admin());
drop policy if exists "journey_documents_update" on public.journey_documents;
create policy "journey_documents_update" on public.journey_documents
  for update to authenticated using (user_id = auth.uid() or public.is_admin())
  with check (user_id = auth.uid() or public.is_admin());
drop policy if exists "journey_documents_delete" on public.journey_documents;
create policy "journey_documents_delete" on public.journey_documents
  for delete to authenticated using (user_id = auth.uid() or public.is_admin());

-- Events: own history readable, own actions insertable, admins see everything.
drop policy if exists "journey_events_read" on public.journey_events;
create policy "journey_events_read" on public.journey_events
  for select to authenticated using (user_id = auth.uid() or public.is_admin());
drop policy if exists "journey_events_insert" on public.journey_events;
create policy "journey_events_insert" on public.journey_events
  for insert to authenticated with check (user_id = auth.uid() or public.is_admin());

-- ── Who is allowed to decide ────────────────────────────────────────────────
-- An administrator, or a privileged server role. service_role and the SQL
-- editor carry no admin JWT, so they are named explicitly: without this a
-- server-side task or a manual fix would be silently reverted by the guards
-- below. Written defensively so a missing auth helper can never break writes.
create or replace function public.journey_privileged()
returns boolean
language plpgsql
stable
security definer
set search_path = public
as $fn$
declare
  ok boolean := false;
  claims text;
begin
  begin
    ok := public.is_admin();
  exception when others then
    ok := false;
  end;
  if ok then return true; end if;

  /* Do NOT test current_user here. This function is SECURITY DEFINER, so
     current_user is always its owner (postgres) and the test would pass for
     every caller, silently disabling every guard that depends on it.

     Instead, look at the request itself. A web request always carries JWT
     claims; the SQL editor, a migration and a direct psql session carry none,
     and those are trusted. */
  claims := current_setting('request.jwt.claims', true);
  if claims is null or claims = '' then
    return true;               -- not a web request
  end if;

  begin
    if coalesce(auth.jwt() ->> 'role', '') = 'service_role' then
      return true;             -- server-side key
    end if;
  exception when others then
    null;
  end;

  return false;
end;
$fn$;

-- ── Guard: only an administrator may approve or write review fields ─────────
-- The student owns their progress row, so column-level protection has to be a
-- trigger. A student changing their own comment is fine; the advisor's note,
-- the review comment, the reviewer stamp and above all the decision itself are
-- not theirs to make. This is the rule the whole module rests on: a step only
-- becomes 'completed' when an administrator approves it.
create or replace function public.journey_progress_guard()
returns trigger
language plpgsql
security definer
set search_path = public
as $fn$
declare
  may_skip boolean := false;
begin
  if public.journey_privileged() then
    return new;
  end if;

  new.advisor_note   := old.advisor_note;
  new.review_comment := old.review_comment;
  new.reviewed_by    := old.reviewed_by;
  new.reviewed_at    := old.reviewed_at;

  -- A student may only submit, withdraw a submission, or skip a step the
  -- administrator marked skippable. Approval and rejection are not theirs.
  if new.state = 'skipped' and new.state is distinct from old.state then
    select coalesce((s.rules ->> 'allowSkip')::boolean, false)
      into may_skip
      from public.journey_steps s
     where s.id = new.step_id;
    if not coalesce(may_skip, false) then
      new.state := old.state;
    end if;
  elsif new.state not in ('pending','in_progress') then
    new.state := old.state;
  end if;

  -- completed_at only ever accompanies an administrator's approval.
  if new.state is distinct from 'completed' then
    new.completed_at := null;
  else
    new.completed_at := old.completed_at;
  end if;

  return new;
end;
$fn$;

drop trigger if exists journey_progress_guard_trg on public.journey_progress;
create trigger journey_progress_guard_trg before update on public.journey_progress
  for each row execute function public.journey_progress_guard();

-- The same rule on insert: a new progress row may not arrive pre-approved.
create or replace function public.journey_progress_insert_guard()
returns trigger
language plpgsql
security definer
set search_path = public
as $fn$
declare
  may_skip boolean := false;
begin
  if public.journey_privileged() then
    return new;
  end if;

  if new.state = 'skipped' then
    -- Skipping straight away is allowed, but only where the step permits it.
    select coalesce((s.rules ->> 'allowSkip')::boolean, false)
      into may_skip
      from public.journey_steps s
     where s.id = new.step_id;
    if not coalesce(may_skip, false) then
      new.state := 'pending';
    end if;
  elsif new.state not in ('pending','in_progress') then
    new.state := 'pending';
  end if;

  new.completed_at   := null;
  new.reviewed_at    := null;
  new.reviewed_by    := null;
  new.advisor_note   := '';
  new.review_comment := '';
  return new;
end;
$fn$;

drop trigger if exists journey_progress_insert_guard_trg on public.journey_progress;
create trigger journey_progress_insert_guard_trg before insert on public.journey_progress
  for each row execute function public.journey_progress_insert_guard();

-- Same guard for document verification: students upload, admins decide.
create or replace function public.journey_documents_guard()
returns trigger
language plpgsql
security definer
set search_path = public
as $fn$
begin
  if public.journey_privileged() then
    return new;
  end if;
  new.review_comment := old.review_comment;
  new.reviewed_by    := old.reviewed_by;
  new.reviewed_at    := old.reviewed_at;
  -- A student may only move a document back into the review pipeline.
  if new.status not in ('pending','uploaded') then
    new.status := old.status;
  end if;
  return new;
end;
$fn$;

drop trigger if exists journey_documents_guard_trg on public.journey_documents;
create trigger journey_documents_guard_trg before update on public.journey_documents
  for each row execute function public.journey_documents_guard();

-- A student may not insert an already-verified document either.
create or replace function public.journey_documents_insert_guard()
returns trigger
language plpgsql
security definer
set search_path = public
as $fn$
begin
  if public.journey_privileged() then
    return new;
  end if;
  if new.status not in ('pending','uploaded') then
    new.status := 'uploaded';
  end if;
  new.review_comment := '';
  new.reviewed_by    := null;
  new.reviewed_at    := null;
  return new;
end;
$fn$;

drop trigger if exists journey_documents_insert_guard_trg on public.journey_documents;
create trigger journey_documents_insert_guard_trg before insert on public.journey_documents
  for each row execute function public.journey_documents_insert_guard();

-- ── Guard: a student may request a stage approval, never grant one ──────────
-- The update policy is already admin-only, but INSERT is the student's own, so
-- without this a student could insert a row that is approved from the start and
-- unlock the whole roadmap.
create or replace function public.journey_stage_approvals_guard()
returns trigger
language plpgsql
security definer
set search_path = public
as $fn$
begin
  if public.journey_privileged() then
    return new;
  end if;
  new.state          := 'waiting';
  new.reviewed_by    := null;
  new.reviewed_at    := null;
  new.review_comment := '';
  return new;
end;
$fn$;

drop trigger if exists journey_stage_approvals_guard_trg on public.journey_stage_approvals;
create trigger journey_stage_approvals_guard_trg before insert on public.journey_stage_approvals
  for each row execute function public.journey_stage_approvals_guard();

-- Re-submitting a rejected stage is an UPDATE of the student's existing row, so
-- they need update rights on it. The guard forces the row back to 'waiting' and
-- clears the old decision, which is exactly what re-submitting means.
drop policy if exists "journey_approvals_write" on public.journey_stage_approvals;
create policy "journey_approvals_write" on public.journey_stage_approvals
  for update to authenticated using (user_id = auth.uid() or public.is_admin())
  with check (user_id = auth.uid() or public.is_admin());

drop trigger if exists journey_stage_approvals_update_trg on public.journey_stage_approvals;
create trigger journey_stage_approvals_update_trg before update on public.journey_stage_approvals
  for each row execute function public.journey_stage_approvals_guard();

-- ── Realtime ────────────────────────────────────────────────────────────────
-- Students must see an administrator's edits without reloading the page, so the
-- journey tables broadcast their changes. "add table" errors when the table is
-- already published, hence the per-table exception handling.
do $$
declare t text;
begin
  foreach t in array array[
    'journey_stages','journey_steps','journey_blocks','journey_reminders',
    'journey_progress','journey_stage_approvals','journey_documents','journey_events'
  ] loop
    begin
      execute format('alter publication supabase_realtime add table public.%I', t);
    exception when duplicate_object or undefined_object then
      null;  -- already published, or this project has no realtime publication
    end;
  end loop;
end $$;

notify pgrst, 'reload schema';
