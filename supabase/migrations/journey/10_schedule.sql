-- 10 · Per-user schedule.
--
-- Additive only. The Schedule module stored events in the browser, so an
-- administrator could never see a student's calendar and nothing survived a
-- change of device. This gives every user one schedule the platform owns.
--
-- Safe to run more than once.

create table if not exists public.schedule_events (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null,
  kind         text not null default 'note',
  title        text not null default '',
  description  text not null default '',
  -- Date and time are kept apart: many items are all-day and have no time.
  event_date   date not null,
  event_time   text,
  category     text not null default '',
  university   text not null default '',
  mode         text not null default '',
  location     text not null default '',
  completed    boolean not null default false,
  pinned       boolean not null default false,
  checklist    jsonb not null default '[]'::jsonb,
  reminder     jsonb not null default '{}'::jsonb,
  -- Recurrence: none | daily | weekly | monthly | yearly, with an optional end.
  repeat_rule  text not null default 'none',
  repeat_until date,
  colour       text not null default '',
  created_by   text not null default 'student',
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

alter table public.schedule_events drop constraint if exists schedule_events_kind_ck;
alter table public.schedule_events add  constraint schedule_events_kind_ck
  check (kind in ('appointment','deadline','note','reminder','interview','official','meeting','travel','visa','embassy','personal'));

alter table public.schedule_events drop constraint if exists schedule_events_repeat_ck;
alter table public.schedule_events add  constraint schedule_events_repeat_ck
  check (repeat_rule in ('none','daily','weekly','monthly','yearly'));

alter table public.schedule_events drop constraint if exists schedule_events_author_ck;
alter table public.schedule_events add  constraint schedule_events_author_ck
  check (created_by in ('student','advisor','system'));

create index if not exists schedule_events_user on public.schedule_events (user_id, event_date);

drop trigger if exists schedule_events_touch on public.schedule_events;
create trigger schedule_events_touch before update on public.schedule_events
  for each row execute function public.journey_touch();

alter table public.schedule_events enable row level security;

-- A student manages their own calendar; administrators manage everyone's.
drop policy if exists "schedule_events_read" on public.schedule_events;
create policy "schedule_events_read" on public.schedule_events
  for select to authenticated using (user_id = auth.uid() or public.is_admin());
drop policy if exists "schedule_events_insert" on public.schedule_events;
create policy "schedule_events_insert" on public.schedule_events
  for insert to authenticated with check (user_id = auth.uid() or public.is_admin());
drop policy if exists "schedule_events_update" on public.schedule_events;
create policy "schedule_events_update" on public.schedule_events
  for update to authenticated using (user_id = auth.uid() or public.is_admin())
  with check (user_id = auth.uid() or public.is_admin());
drop policy if exists "schedule_events_delete" on public.schedule_events;
create policy "schedule_events_delete" on public.schedule_events
  for delete to authenticated using (user_id = auth.uid() or public.is_admin());

-- Live updates, so an advisor's change lands on the student's calendar at once.
do $$
begin
  begin
    execute 'alter publication supabase_realtime add table public.schedule_events';
  exception when duplicate_object or undefined_object then
    null;
  end;
end $$;

notify pgrst, 'reload schema';
