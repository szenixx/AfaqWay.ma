-- 18 · Journey automation: one outbox for every channel, one sweeper, one guard.
--
-- The Excel asks the journey to talk back to the student: a pinned high-priority
-- notification when Stage 4 unlocks, four reminders before the VFS appointment,
-- a chat message and a WhatsApp message when the residence permit is decided.
-- Those are four different transports with one shape, so they get one table.
--
-- Depends on 09_review_workflow.sql (journey_privileged, the progress guards)
-- and 14_platform_updates.sql (notifications). Apply after both.
--
-- Sections:
--   01  columns the automation needs
--   02  message templates (the wording, admin-editable)
--   03  the outbox
--   04  emit / cancel / sweep
--   05  the completion guard, taught about self-completed steps
--   06  RLS
--   07  the scheduled sweep

/* ── 01 · Columns ────────────────────────────────────────────────────────── */

-- What the student answered on a step: the VFS appointment they booked, the
-- checklist they ticked, the TRP outcome they reported, when they first opened
-- it. UI state, never authorisation.
alter table public.journey_progress add column if not exists meta jsonb not null default '{}'::jsonb;

-- "Pin the notification at the top of the Notifications page … Mark the
-- notification as High Priority."
alter table public.notifications add column if not exists priority text not null default 'normal';
alter table public.notifications add column if not exists pinned boolean not null default false;

-- "The step must be automatically marked as Completed only when an administrator
-- updates the student's application status to Residence Permit Approved or
-- Residence Permit Rejected." Administrator-owned, so the profiles guard pins it.
alter table public.profiles add column if not exists trp_status text not null default 'none';

/* ── 02 · Message templates ──────────────────────────────────────────────── */

-- The wording every automated message uses, keyed by the event that raises it.
-- One row per channel, so switching WhatsApp on later means draining a queue,
-- not rewriting the callers. Seeded by scripts/import-journey.mjs from the
-- Excel; an administrator may edit the text without a deploy.
create table if not exists public.journey_templates (
  event      text not null,
  channel    text not null,                 -- platform | chat | whatsapp | email
  title      text not null default '',
  body       text not null default '',
  link       text not null default '',
  priority   text not null default 'normal',
  pinned     boolean not null default false,
  enabled    boolean not null default true,
  updated_at timestamptz not null default now(),
  primary key (event, channel)
);

/* ── 03 · The outbox ─────────────────────────────────────────────────────── */

-- Every message the journey wants to send, on every channel, before and after
-- it is delivered. A row is the record that the platform intended to say
-- something, which is what makes the WhatsApp transport a later detail.
create table if not exists public.journey_outbox (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null,
  event      text not null,
  channel    text not null default 'platform',
  kind       text not null default 'journey',
  title      text not null default '',
  body       text not null default '',
  link       text not null default '',
  priority   text not null default 'normal',
  pinned     boolean not null default false,
  due_at     timestamptz not null default now(),
  -- pending → due and waiting · sent → delivered · ready → no transport yet
  -- cancelled → the reason for it went away · failed → the transport refused
  state      text not null default 'pending',
  sent_at    timestamptz,
  error      text not null default '',
  step_id    uuid,
  stage_id   uuid,
  -- A one-shot event ("send this only once, when Stage 4 unlocks").
  dedupe_key text,
  -- Lets a scheduled message be withdrawn when it stops making sense.
  cancel_key text,
  meta       jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create unique index if not exists journey_outbox_once
  on public.journey_outbox (user_id, dedupe_key) where dedupe_key is not null;
create index if not exists journey_outbox_due
  on public.journey_outbox (state, due_at) where state = 'pending';
create index if not exists journey_outbox_user on public.journey_outbox (user_id, created_at desc);
create index if not exists journey_outbox_cancel on public.journey_outbox (user_id, cancel_key) where cancel_key is not null;

/* ── 04 · Emit, cancel, sweep ────────────────────────────────────────────── */

-- Placeholders are written {{name}} and filled from the context object.
create or replace function public.journey_render(p_text text, p_ctx jsonb)
returns text language plpgsql immutable set search_path to 'public' as $$
declare
  out_text text := coalesce(p_text, '');
  k text;
begin
  if p_ctx is null then return out_text; end if;
  for k in select jsonb_object_keys(p_ctx) loop
    out_text := replace(out_text, '{{' || k || '}}', coalesce(p_ctx ->> k, ''));
  end loop;
  return out_text;
end;
$$;

-- Raises one event on every channel its template enables.
--
-- SECURITY DEFINER on purpose: the student's browser is what completes a step,
-- so it is what has to schedule the reminders. It must not be able to choose
-- the words. The caller names an EVENT; the wording comes from the template
-- table, which only an administrator can write. A student may only emit for
-- themselves, whatever user id the client passes.
create or replace function public.journey_emit(
  p_event      text,
  p_ctx        jsonb        default '{}'::jsonb,
  p_user       uuid         default null,
  p_step_id    uuid         default null,
  p_stage_id   uuid         default null,
  p_due_at     timestamptz  default now(),
  p_dedupe_key text         default null,
  p_cancel_key text         default null
) returns integer
language plpgsql security definer set search_path to 'public' as $$
declare
  target uuid;
  n integer := 0;
  t record;
begin
  -- A student emits for themselves; only a privileged caller may name someone.
  if public.journey_privileged() then
    target := coalesce(p_user, auth.uid());
  else
    target := auth.uid();
  end if;
  if target is null then return 0; end if;

  for t in select * from public.journey_templates where event = p_event and enabled loop
    insert into public.journey_outbox
      (user_id, event, channel, kind, title, body, link, priority, pinned,
       due_at, step_id, stage_id, dedupe_key, cancel_key, meta)
    values
      (target, p_event, t.channel,
       case when t.channel = 'platform' then 'journey' else t.channel end,
       public.journey_render(t.title, p_ctx),
       public.journey_render(t.body, p_ctx),
       t.link, t.priority, t.pinned,
       coalesce(p_due_at, now()), p_step_id, p_stage_id,
       -- The dedupe key is per channel, or two channels of one event collide.
       case when p_dedupe_key is null then null else p_dedupe_key || ':' || t.channel end,
       p_cancel_key, coalesce(p_ctx, '{}'::jsonb))
    on conflict (user_id, dedupe_key) where dedupe_key is not null do nothing;
    n := n + 1;
  end loop;
  return n;
end;
$$;

-- Withdraws everything still pending under one cancel key: the student opened
-- the step, so the 48-hour nudge is moot; the appointment moved, so the old
-- reminders are wrong.
create or replace function public.journey_cancel(p_cancel_key text, p_user uuid default null)
returns integer
language plpgsql security definer set search_path to 'public' as $$
declare
  target uuid;
  n integer;
begin
  if public.journey_privileged() then target := coalesce(p_user, auth.uid());
  else target := auth.uid(); end if;
  if target is null or p_cancel_key is null then return 0; end if;

  update public.journey_outbox set state = 'cancelled'
   where user_id = target and cancel_key = p_cancel_key and state = 'pending';
  get diagnostics n = row_count;
  return n;
end;
$$;

-- Delivers everything that has come due. Called by pg_cron; safe to run by hand.
create or replace function public.journey_outbox_sweep()
returns integer
language plpgsql security definer set search_path to 'public' as $$
declare
  r record;
  n integer := 0;
begin
  for r in
    select * from public.journey_outbox
     where state = 'pending' and due_at <= now()
     order by due_at
     limit 500
  loop
    begin
      if r.channel = 'platform' then
        insert into public.notifications (user_id, kind, title, body, link, priority, pinned)
        values (r.user_id, r.kind, r.title, r.body, r.link, r.priority, r.pinned);
        update public.journey_outbox set state = 'sent', sent_at = now() where id = r.id;

      elsif r.channel = 'chat' then
        insert into public.messages (user_id, sender, body, meta)
        values (r.user_id, 'admin', r.body, r.meta || jsonb_build_object('kind', 'automated', 'event', r.event));
        update public.journey_outbox set state = 'sent', sent_at = now() where id = r.id;

      else
        /* WhatsApp and email have no outbound transport yet. The row becomes
           'ready' and waits: switching a channel on later means draining this
           queue, not finding every caller. Nothing is lost and nothing is
           silently dropped. */
        update public.journey_outbox set state = 'ready' where id = r.id;
      end if;
      n := n + 1;
    exception when others then
      update public.journey_outbox set state = 'failed', error = sqlerrm where id = r.id;
    end;
  end loop;
  return n;
end;
$$;

/* ── 05 · The completion guard ───────────────────────────────────────────── */

-- The Excel names steps that carry no admin approval: "Display a prominent Mark
-- as Completed button … Do not require admin approval." That is a per-step
-- permission, so the guard reads the step's own rules instead of refusing every
-- self-completion. Everything else stays exactly as it was: a student still
-- cannot approve a reviewed step, write a review comment, or back-date anything.
create or replace function public.journey_progress_guard()
returns trigger language plpgsql security definer set search_path to 'public' as $$
declare
  mode      text;
  may_skip  boolean := false;
  who_plan  text;
begin
  if public.journey_privileged() then
    return new;
  end if;

  new.advisor_note   := old.advisor_note;
  new.review_comment := old.review_comment;
  new.reviewed_by    := old.reviewed_by;
  new.reviewed_at    := old.reviewed_at;

  select coalesce(s.rules ->> 'completion', 'review'),
         coalesce((s.rules ->> 'allowSkip')::boolean, false)
    into mode, may_skip
    from public.journey_steps s
   where s.id = new.step_id;

  if new.state = 'skipped' and new.state is distinct from old.state then
    if not coalesce(may_skip, false) then new.state := old.state; end if;

  elsif new.state = 'completed' and new.state is distinct from old.state then
    if mode = 'self' then
      null;                                  -- the Excel gives this one away
    elsif mode = 'decision' then
      -- "For Full Service students: hide the Mark as Completed button. The
      -- application status is managed entirely by administrators."
      select p.plan into who_plan from public.profiles p where p.id = auth.uid();
      if coalesce(who_plan, '') <> 'self_service' then new.state := old.state; end if;
    else
      new.state := old.state;                -- reviewed steps are the advisor's
    end if;

  elsif new.state not in ('pending', 'in_progress', 'completed') then
    new.state := old.state;
  end if;

  if new.state is distinct from 'completed' then
    new.completed_at := null;
  elsif old.state is distinct from 'completed' then
    new.completed_at := now();               -- stamped here, never by the client
  else
    new.completed_at := old.completed_at;
  end if;

  return new;
end;
$$;

create or replace function public.journey_progress_insert_guard()
returns trigger language plpgsql security definer set search_path to 'public' as $$
declare
  mode      text;
  may_skip  boolean := false;
  who_plan  text;
begin
  if public.journey_privileged() then
    return new;
  end if;

  select coalesce(s.rules ->> 'completion', 'review'),
         coalesce((s.rules ->> 'allowSkip')::boolean, false)
    into mode, may_skip
    from public.journey_steps s
   where s.id = new.step_id;

  if new.state = 'skipped' then
    if not coalesce(may_skip, false) then new.state := 'pending'; end if;

  elsif new.state = 'completed' then
    if mode = 'decision' then
      select p.plan into who_plan from public.profiles p where p.id = auth.uid();
      if coalesce(who_plan, '') <> 'self_service' then new.state := 'pending'; end if;
    elsif mode <> 'self' then
      new.state := 'pending';
    end if;

  elsif new.state not in ('pending', 'in_progress') then
    new.state := 'pending';
  end if;

  new.completed_at   := case when new.state = 'completed' then now() else null end;
  new.reviewed_at    := null;
  new.reviewed_by    := null;
  new.advisor_note   := '';
  new.review_comment := '';
  return new;
end;
$$;

-- trp_status joins the commercial fields a student may not write themselves.
create or replace function public.profiles_guard()
returns trigger language plpgsql security definer set search_path to 'public' as $$
begin
  if public.journey_privileged() then
    return new;
  end if;

  new.plan               := old.plan;
  new.plan_status        := old.plan_status;
  new.plan_activated_at  := old.plan_activated_at;
  new.banned             := old.banned;
  new.user_number        := old.user_number;
  new.email              := old.email;
  new.id                 := old.id;
  -- The residence permit outcome is recorded by an administrator, never claimed.
  new.trp_status         := old.trp_status;

  return new;
end;
$$;

/* ── 06 · Row level security ─────────────────────────────────────────────── */

alter table public.journey_outbox    enable row level security;
alter table public.journey_templates enable row level security;

-- Plain pairs, never a DO block: one failing policy must not abort the rest.
drop policy if exists journey_outbox_read_own on public.journey_outbox;
create policy journey_outbox_read_own on public.journey_outbox
  for select using (user_id = auth.uid() or public.is_admin());

-- No student INSERT or UPDATE policy anywhere: rows only ever arrive through
-- journey_emit, which decides both the recipient and the wording.
drop policy if exists journey_outbox_admin_write on public.journey_outbox;
create policy journey_outbox_admin_write on public.journey_outbox
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists journey_templates_read on public.journey_templates;
create policy journey_templates_read on public.journey_templates
  for select using (true);

drop policy if exists journey_templates_admin on public.journey_templates;
create policy journey_templates_admin on public.journey_templates
  for all using (public.is_admin()) with check (public.is_admin());

grant execute on function public.journey_emit(text, jsonb, uuid, uuid, uuid, timestamptz, text, text) to authenticated;
grant execute on function public.journey_cancel(text, uuid) to authenticated;

/* ── 07 · The scheduled sweep ────────────────────────────────────────────── */

-- Reminders have to fire while nobody is looking: a student who books a VFS
-- appointment for next week is not sitting in the app when the 7-day reminder
-- comes due. Every five minutes is well inside the smallest window the Excel
-- asks for (2 hours).
create extension if not exists pg_cron;

do $$
begin
  perform cron.unschedule('journey-outbox-sweep');
exception when others then
  null;                                       -- not scheduled yet
end $$;

select cron.schedule('journey-outbox-sweep', '*/5 * * * *', $sweep$select public.journey_outbox_sweep()$sweep$);

notify pgrst, 'reload schema';
