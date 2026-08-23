-- ── Notification identity + the unanswered-advisor reminder ─────────────────
-- Two things the notification centre needs beyond the row it already has:
--   1. somewhere to keep what a notification is ABOUT, so the inbox can colour
--      a journey decision without the verdict being repeated in its wording;
--   2. a sweep that raises a reminder when an advisor's message goes 24 hours
--      unanswered, once, and never when the student has already replied.
--
-- Re-runnable. Every statement is independent: no DO blocks around CREATE
-- POLICY, and no \i includes, so a single failure cannot roll back the rest.

-- ── 1 · meta ────────────────────────────────────────────────────────────────
-- Deliberately loose. The centre never reads it; only the surface that raised
-- the row knows what it means, and a row without it is simply a row with no
-- extra information rather than a broken one.
alter table public.notifications add column if not exists meta jsonb;

-- ── 2 · The unanswered-advisor sweep ────────────────────────────────────────
-- Runs with nobody looking, which is the whole point: the student who needs
-- this reminder is precisely the one who has not opened the platform since the
-- advisor wrote. A client-side check would never fire for them.
create or replace function public.advisor_reminder_sweep()
returns void
language plpgsql
security definer
set search_path = public
as $fn$
begin
  insert into public.notifications (user_id, kind, title, body, link, meta)
  select
    m.user_id,
    'message',
    'You have an unanswered message from your advisor',
    'Open your conversation to reply.',
    'messages',
    jsonb_build_object('message_id', m.id)
  from (
    -- The most recent advisor message per student, and nothing older: a
    -- reminder is about the conversation's current state, not its history.
    select distinct on (user_id) id, user_id, created_at
      from public.messages
     where sender = 'admin'
     order by user_id, created_at desc
  ) m
  where
    -- Twenty-four hours, counted from the advisor's message.
    m.created_at <= now() - interval '24 hours'
    -- Not answered. Any student message after it closes the case, which is
    -- what stops a reminder being raised for a conversation already replied to.
    and not exists (
      select 1 from public.messages r
       where r.user_id = m.user_id
         and r.sender <> 'admin'
         and r.created_at > m.created_at
    )
    -- Raised once. The advisor message's id is kept on the notification, so a
    -- sweep every hour cannot produce a second reminder for the same message.
    and not exists (
      select 1 from public.notifications n
       where n.user_id = m.user_id
         and n.kind = 'message'
         and n.meta ->> 'message_id' = m.id::text
    );
end;
$fn$;

-- Hourly. The rule is "at least 24 hours", so the exact minute it lands on
-- does not matter and an hourly sweep keeps the table quiet.
select cron.unschedule('advisor-reminder-sweep')
 where exists (select 1 from cron.job where jobname = 'advisor-reminder-sweep');
select cron.schedule('advisor-reminder-sweep', '0 * * * *', $sweep$select public.advisor_reminder_sweep()$sweep$);

notify pgrst, 'reload schema';
