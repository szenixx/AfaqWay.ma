/* 17_reset_users.sql — pre-launch reset. DESTRUCTIVE AND IRREVERSIBLE.
 *
 * Removes every account and everything attached to one, keeping only the
 * super admin. Run once, in the Supabase SQL editor, before launch.
 *
 * WHAT SURVIVES
 *   - the super admin's auth user and profile         (MASTER_EMAIL below)
 *   - the `admins` table                              (staff roles)
 *   - the journey configuration: stages, steps, blocks, reminders, versions
 *     (that is the product, not user data)
 *   - platform_updates                                (announcement history)
 *
 * WHAT IS DELETED
 *   - every other auth user, which cascades to their profile
 *   - all journey progress, stage approvals, documents and events
 *   - all schedule events, messages, notifications and payments
 *
 * Files in R2 were already removed separately; the rows that referenced them
 * go here, so no row is left pointing at a file that no longer exists.
 *
 * There is no undo. Take a database backup first if there is any doubt.
 */

begin;

-- The one account that survives. Change this and you keep a different person.
create temporary table keep_user as
select id from auth.users where lower(email) = lower('index.abde06@gmail.com');

do $$
begin
  if not exists (select 1 from keep_user) then
    raise exception 'Super admin not found in auth.users — refusing to delete every account.';
  end if;
end $$;

/* Per-user data first, so nothing depends on a row that is about to vanish.
   Most of these would cascade from auth.users anyway; they are listed
   explicitly so the reset does not depend on how each foreign key was
   declared, and so the row counts below are meaningful. */
delete from public.journey_progress          where user_id not in (select id from keep_user);
delete from public.journey_stage_approvals   where user_id not in (select id from keep_user);
delete from public.journey_documents         where user_id not in (select id from keep_user);
delete from public.journey_events            where user_id not in (select id from keep_user);
delete from public.schedule_events           where user_id not in (select id from keep_user);
delete from public.notifications             where user_id not in (select id from keep_user);
delete from public.messages                  where user_id not in (select id from keep_user);
delete from public.payments                  where user_id not in (select id from keep_user);

-- Profiles, then the accounts themselves. Deleting the auth user cascades to
-- any profile row that outlived the statement above.
delete from public.profiles  where id not in (select id from keep_user);
delete from auth.users       where id not in (select id from keep_user);

/* The survivor keeps their staff role but starts clean: no stale plan, no
   half-finished onboarding, no receipt pointing at a deleted R2 object. */
update public.profiles
   set plan = null,
       plan_status = null,
       plan_activated_at = null,
       avatar_path = null,
       banned = false
 where id in (select id from keep_user);

commit;

/* ── Verify ────────────────────────────────────────────────────────────────
   Expect 1 / 1 and 0 everywhere else. */
select 'auth.users'   as table, count(*) from auth.users
union all select 'profiles',    count(*) from public.profiles
union all select 'payments',    count(*) from public.payments
union all select 'messages',    count(*) from public.messages
union all select 'notifications', count(*) from public.notifications
union all select 'journey_progress', count(*) from public.journey_progress
union all select 'journey_documents', count(*) from public.journey_documents
union all select 'journey_events', count(*) from public.journey_events
union all select 'schedule_events', count(*) from public.schedule_events
union all select 'admins (kept)', count(*) from public.admins
union all select 'journey_stages (kept)', count(*) from public.journey_stages;
