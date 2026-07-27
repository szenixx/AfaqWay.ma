-- 11 · Schedule event ownership.
--
-- Additive only. Widens the author check so an event can be owned by the
-- platform, a country or the system, and enforces the rule that a student may
-- only touch events they created themselves.
--
-- Safe to run more than once.
--
-- DEPENDS ON 09_review_workflow.sql, which defines public.journey_privileged().
-- The guard below calls it, so until 09 is applied this migration's triggers
-- cannot decide who is privileged and the ownership rule does not hold.
-- Run 09 first, or run it afterwards to repair this one.

-- Existing rows keep 'student' / 'advisor' / 'system'; three owners are added.
alter table public.schedule_events drop constraint if exists schedule_events_author_ck;
alter table public.schedule_events add  constraint schedule_events_author_ck
  check (created_by in ('student','advisor','system','platform','country'));

-- Who created it, kept for display and for the guard below.
alter table public.schedule_events add column if not exists owner_id uuid;

-- ── Permissions ─────────────────────────────────────────────────────────────
-- RLS lets a student write rows where user_id = auth.uid(), which is their own
-- calendar, but an advisor's event also lives on that calendar. Ownership is a
-- column, so it takes a trigger: a student may only change or delete what they
-- created, and may only ever create student-owned events.
create or replace function public.schedule_events_guard()
returns trigger
language plpgsql
security definer
set search_path = public
as $fn$
begin
  if public.journey_privileged() then
    return new;
  end if;

  if tg_op = 'INSERT' then
    -- Anything a student adds is theirs, whatever the client claimed.
    new.created_by := 'student';
    new.owner_id   := auth.uid();
    return new;
  end if;

  -- Updates: only student-owned events, and ownership cannot be reassigned.
  if coalesce(old.created_by, 'student') <> 'student' then
    return old;
  end if;
  new.created_by := old.created_by;
  new.owner_id   := old.owner_id;
  return new;
end;
$fn$;

drop trigger if exists schedule_events_guard_ins on public.schedule_events;
create trigger schedule_events_guard_ins before insert on public.schedule_events
  for each row execute function public.schedule_events_guard();

drop trigger if exists schedule_events_guard_upd on public.schedule_events;
create trigger schedule_events_guard_upd before update on public.schedule_events
  for each row execute function public.schedule_events_guard();

-- Deleting is the same rule, expressed where a trigger cannot help.
drop policy if exists "schedule_events_delete" on public.schedule_events;
create policy "schedule_events_delete" on public.schedule_events
  for delete to authenticated
  using (
    public.is_admin()
    or (user_id = auth.uid() and coalesce(created_by, 'student') = 'student')
  );

notify pgrst, 'reload schema';
