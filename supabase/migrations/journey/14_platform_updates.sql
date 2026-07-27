-- 14 · Platform updates and a real notification centre.
--
-- Additive only. Two new tables and one helper function; nothing existing is
-- changed. Safe to run more than once.
--
-- The student notification centre was demo data in the front end. This gives it
-- a table, and gives administrators a way to announce something to everyone:
-- one platform_updates row fans out to a notification per active student.

-- ── Who may publish ─────────────────────────────────────────────────────────
-- is_admin() covers every administrator. Announcements are a super-admin
-- action, so they need their own check. Defensive like is_admin(): a missing
-- table returns false rather than erroring.
create or replace function public.is_superadmin()
returns boolean
language plpgsql
stable
security definer
set search_path = public
as $fn$
declare ok boolean := false;
begin
  begin
    select exists (
      select 1 from public.admins a
       where lower(a.email) = lower(coalesce(auth.jwt() ->> 'email', ''))
         and coalesce(a.banned, false) = false
         and a.role = 'superadmin'
    ) into ok;
  exception when undefined_table or undefined_column then
    ok := false;
  end;
  return coalesce(ok, false);
end;
$fn$;

-- ── Announcements ───────────────────────────────────────────────────────────
create table if not exists public.platform_updates (
  id           uuid primary key default gen_random_uuid(),
  title        text not null,
  body         text not null default '',
  -- [{ path, fileName, mimeType, size }] — files live in R2, not here.
  attachments  jsonb not null default '[]'::jsonb,
  author_email text,
  created_by   uuid,
  created_at   timestamptz not null default now()
);

create index if not exists platform_updates_recent on public.platform_updates (created_at desc);

alter table public.platform_updates enable row level security;

drop policy if exists "platform_updates_read" on public.platform_updates;
create policy "platform_updates_read" on public.platform_updates
  for select to authenticated using (true);

drop policy if exists "platform_updates_write" on public.platform_updates;
create policy "platform_updates_write" on public.platform_updates
  for all to authenticated using (public.is_superadmin()) with check (public.is_superadmin());

-- ── Notification centre ─────────────────────────────────────────────────────
-- One row per user per event. Journey decisions, document verifications,
-- schedule reminders and platform announcements all land here.
create table if not exists public.notifications (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null,
  kind        text not null default 'update',
  title       text not null,
  body        text not null default '',
  -- Where the notification takes the student, e.g. 'journey' or 'documents'.
  link        text not null default '',
  read        boolean not null default false,
  created_at  timestamptz not null default now()
);

alter table public.notifications drop constraint if exists notifications_kind_ck;
alter table public.notifications add  constraint notifications_kind_ck
  check (kind in ('update','journey','document','schedule','message','payment','system'));

create index if not exists notifications_user on public.notifications (user_id, created_at desc);
create index if not exists notifications_unread on public.notifications (user_id) where not read;

alter table public.notifications enable row level security;

-- A student reads and dismisses their own; administrators may create any.
drop policy if exists "notifications_read" on public.notifications;
create policy "notifications_read" on public.notifications
  for select to authenticated using (user_id = auth.uid() or public.is_admin());
drop policy if exists "notifications_insert" on public.notifications;
create policy "notifications_insert" on public.notifications
  for insert to authenticated with check (public.is_admin() or user_id = auth.uid());
drop policy if exists "notifications_update" on public.notifications;
create policy "notifications_update" on public.notifications
  for update to authenticated using (user_id = auth.uid() or public.is_admin())
  with check (user_id = auth.uid() or public.is_admin());
drop policy if exists "notifications_delete" on public.notifications;
create policy "notifications_delete" on public.notifications
  for delete to authenticated using (user_id = auth.uid() or public.is_admin());

-- ── Fan-out ─────────────────────────────────────────────────────────────────
-- Publishing an announcement notifies every active student, in one statement,
-- so the client never loops over users.
create or replace function public.fanout_platform_update()
returns trigger
language plpgsql
security definer
set search_path = public
as $fn$
begin
  insert into public.notifications (user_id, kind, title, body, link)
  select p.id, 'update', new.title, left(new.body, 400), 'notifications'
    from public.profiles p
   where coalesce(p.banned, false) = false;
  return new;
end;
$fn$;

drop trigger if exists platform_updates_fanout on public.platform_updates;
create trigger platform_updates_fanout after insert on public.platform_updates
  for each row execute function public.fanout_platform_update();

-- ── Realtime ────────────────────────────────────────────────────────────────
do $$
declare t text;
begin
  foreach t in array array['platform_updates','notifications'] loop
    begin
      execute format('alter publication supabase_realtime add table public.%I', t);
    exception when duplicate_object or undefined_object then
      null;
    end;
  end loop;
end $$;

notify pgrst, 'reload schema';
